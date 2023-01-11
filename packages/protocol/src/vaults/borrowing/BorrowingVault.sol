// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IFujiOracle} from "../../interfaces/IFujiOracle.sol";
import {IFlasher} from "../../interfaces/IFlasher.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {BaseVault} from "../../abstracts/BaseVault.sol";
import {VaultPermissions} from "../VaultPermissions.sol";

contract BorrowingVault is BaseVault {
  using Math for uint256;

  /**
   * @dev Emitted when a user is liquidated
   * @param caller executor of liquidation.
   * @param receiver receiver of liquidation bonus.
   * @param owner address whose assets are being liquidated.
   * @param collateralSold `owner`'s amount of collateral sold during liquidation.
   * @param debtPaid `owner`'s amount of debt paid back during liquidation.
   * @param price price of collateral at which liquidation was done.
   * @param liquidationFactor what % of debt was liquidated
   */
  event Liquidate(
    address indexed caller,
    address indexed receiver,
    address indexed owner,
    uint256 collateralSold,
    uint256 debtPaid,
    uint256 price,
    uint256 liquidationFactor
  );

  // Custom errors

  error BorrowingVault__borrow_invalidInput();
  error BorrowingVault__borrow_moreThanAllowed();
  error BorrowingVault__payback_invalidInput();
  error BorrowingVault__payback_moreThanMax();
  error BorrowingVault__liquidate_invalidInput();
  error BorrowingVault__liquidate_positionHealthy();
  error BorrowingVault__rebalance_invalidProvider();
  error BorrowingVault__rebalance_invalidFlasher();
  error BorrowingVault__checkFee_excessFee();
  error BorrowingVault__borrow_slippageTooHigh();
  error BorrowingVault__payback_slippageTooHigh();

  /// Liquidation controls

  /// Returns default liquidation close factor: 50% of debt.
  uint256 public constant DEFAULT_LIQUIDATION_CLOSE_FACTOR = 0.5e18;

  /// Returns max liquidation close factor: 100% of debt.
  uint256 public constant MAX_LIQUIDATION_CLOSE_FACTOR = 1e18;

  /// Returns health factor threshold at which max liquidation can occur.
  uint256 public constant FULL_LIQUIDATION_THRESHOLD = 95e16;

  /// Returns the penalty factor at which collateral is sold during liquidation: 90% below oracle price.
  uint256 public constant LIQUIDATION_PENALTY = 0.9e18;

  // error[7733]: for `_debtAsset`
  //TypeError: Immutable variables cannot be read before they are initialized.
  IERC20Metadata private _debtAsset;
  uint8 private immutable _debtDecimals;

  uint256 public debtSharesSupply;

  mapping(address => uint256) internal _debtShares;
  mapping(address => mapping(address => uint256)) private _borrowAllowances;

  IFujiOracle public oracle;

  /*
  Factors
  See: https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme
  */

  /**
   * @dev A factor that defines
   * the maximum Loan-To-Value a user can take.
   */
  uint256 public maxLtv;

  /**
   * @dev A factor that defines the Loan-To-Value
   * at which a user can be liquidated.
   */
  uint256 public liqRatio;

  constructor(
    address asset_,
    address debtAsset_,
    address oracle_,
    address chief_,
    string memory name_,
    string memory symbol_,
    ILendingProvider[] memory providers_
  )
    BaseVault(asset_, chief_, name_, symbol_, providers_)
  {
    _debtAsset = IERC20Metadata(debtAsset_);
    _debtDecimals = _debtAsset.decimals();
    oracle = IFujiOracle(oracle_);
    maxLtv = 75 * 1e16;
    liqRatio = 80 * 1e16;
  }

  receive() external payable {}

  /////////////////////////////////
  /// Debt management overrides ///
  /////////////////////////////////

  /// @inheritdoc BaseVault
  function debtDecimals() public view override returns (uint8) {
    return _debtDecimals;
  }

  /// @inheritdoc BaseVault
  function debtAsset() public view override returns (address) {
    return address(_debtAsset);
  }

  /// @inheritdoc BaseVault
  function balanceOfDebt(address owner) public view override returns (uint256 debt) {
    return convertToDebt(_debtShares[owner]);
  }

  /// @inheritdoc BaseVault
  function totalDebt() public view override returns (uint256) {
    return _checkProvidersBalance("getBorrowBalance");
  }

  /// @inheritdoc BaseVault
  function convertDebtToShares(uint256 debt) public view override returns (uint256 shares) {
    return _convertDebtToShares(debt, Math.Rounding.Down);
  }

  /// @inheritdoc BaseVault
  function convertToDebt(uint256 shares) public view override returns (uint256 debt) {
    return _convertToDebt(shares, Math.Rounding.Down);
  }

  /// @inheritdoc BaseVault
  function maxBorrow(address borrower) public view override returns (uint256) {
    return _computeMaxBorrow(borrower);
  }

  /**
   * @notice Slippage protected `borrow` inspired by EIP5143.
   * Requirements:
   * - MUST mint maximum `maxDebtShares` when calling borrow().
   */
  function borrow(
    uint256 debt,
    address receiver,
    address owner,
    uint256 maxDebtShares
  )
    public
    returns (uint256)
  {
    uint256 receivedDebtShares = borrow(debt, receiver, owner);
    if (receivedDebtShares > maxDebtShares) {
      revert BorrowingVault__borrow_slippageTooHigh();
    }
    return receivedDebtShares;
  }

  /// @inheritdoc BaseVault
  function borrow(uint256 debt, address receiver, address owner) public override returns (uint256) {
    address caller = _msgSender();

    if (debt == 0 || receiver == address(0) || owner == address(0) || debt < minAmount) {
      revert BorrowingVault__borrow_invalidInput();
    }
    if (debt > maxBorrow(owner)) {
      revert BorrowingVault__borrow_moreThanAllowed();
    }

    if (caller != owner) {
      _spendBorrowAllowance(owner, caller, receiver, debt);
    }

    uint256 shares = convertDebtToShares(debt);
    _borrow(caller, receiver, owner, debt, shares);

    return shares;
  }

  /**
   * @notice Slippage protected `payback` inspired by EIP5143.
   * Requirements:
   * - MUST burn at least `minDebtShares` when calling payback().
   */
  function payback(uint256 debt, address owner, uint256 minDebtShares) public returns (uint256) {
    uint256 burnedDebtShares = payback(debt, owner);
    if (burnedDebtShares < minDebtShares) {
      revert BorrowingVault__payback_slippageTooHigh();
    }
    return burnedDebtShares;
  }

  /// @inheritdoc BaseVault
  function payback(uint256 debt, address owner) public override returns (uint256) {
    if (debt == 0 || owner == address(0)) {
      revert BorrowingVault__payback_invalidInput();
    }

    if (debt > convertToDebt(_debtShares[owner])) {
      revert BorrowingVault__payback_moreThanMax();
    }

    uint256 shares = convertDebtToShares(debt);
    _payback(_msgSender(), owner, debt, shares);

    return shares;
  }

  /////////////////////////
  /// Borrow allowances ///
  /////////////////////////

  /**
   * @dev See {IVaultPermissions-borrowAllowance}.
   * Implement in {BorrowingVault}, revert in {LendingVault}
   */
  function borrowAllowance(
    address owner,
    address operator,
    address receiver
  )
    public
    view
    virtual
    override
    returns (uint256)
  {
    return VaultPermissions.borrowAllowance(owner, operator, receiver);
  }

  /**
   * @dev See {IVaultPermissions-decreaseborrowAllowance}.
   * Implement in {BorrowingVault}, revert in {LendingVault}
   */
  function increaseBorrowAllowance(
    address operator,
    address receiver,
    uint256 byAmount
  )
    public
    virtual
    override
    returns (bool)
  {
    return VaultPermissions.increaseBorrowAllowance(operator, receiver, byAmount);
  }

  /**
   * @dev See {IVaultPermissions-decreaseborrowAllowance}.
   * Implement in {BorrowingVault}, revert in {LendingVault}
   */
  function decreaseBorrowAllowance(
    address operator,
    address receiver,
    uint256 byAmount
  )
    public
    virtual
    override
    returns (bool)
  {
    return VaultPermissions.decreaseBorrowAllowance(operator, receiver, byAmount);
  }

  /**
   * @dev See {IVaultPermissions-permitBorrow}.
   * Implement in {BorrowingVault}, revert in {LendingVault}
   */
  function permitBorrow(
    address owner,
    address receiver,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    public
    override
  {
    VaultPermissions.permitBorrow(owner, receiver, value, deadline, v, r, s);
  }

  /**
   * @dev Internal function that computes how much debt
   * a user can take against its 'asset' deposits.
   *
   * Requirements:
   * - SHOULD be implemented in {BorrowingVault} contract.
   * - SHOULD NOT be implemented in a {LendingVault} contract.
   * - SHOULD read price from {FujiOracle}.
   */
  function _computeMaxBorrow(address borrower) internal view returns (uint256 max) {
    uint256 price = oracle.getPriceOf(debtAsset(), asset(), _debtDecimals);
    uint256 assetShares = balanceOf(borrower);
    uint256 assets = convertToAssets(assetShares);
    uint256 debtShares = _debtShares[borrower];
    uint256 debt = convertToDebt(debtShares);

    uint256 baseUserMaxBorrow = ((assets * maxLtv * price) / (1e18 * 10 ** decimals()));
    max = baseUserMaxBorrow > debt ? baseUserMaxBorrow - debt : 0;
  }

  /// @inheritdoc BaseVault
  function _computeFreeAssets(address owner) internal view override returns (uint256 freeAssets) {
    uint256 debtShares = _debtShares[owner];

    // no debt
    if (debtShares == 0) {
      freeAssets = convertToAssets(balanceOf(owner));
    } else {
      uint256 debt = convertToDebt(debtShares);
      uint256 price = oracle.getPriceOf(asset(), debtAsset(), decimals());
      uint256 lockedAssets = (debt * 1e18 * price) / (maxLtv * 10 ** _debtDecimals);

      if (lockedAssets == 0) {
        // Handle wei level amounts in where 'lockedAssets' < 1 wei
        lockedAssets = 1;
      }

      uint256 assets = convertToAssets(balanceOf(owner));

      freeAssets = assets > lockedAssets ? assets - lockedAssets : 0;
    }
  }

  /**
   * @dev Internal conversion function (from debt to shares) with support for rounding direction.
   * Will revert if debt > 0, debtSharesSupply > 0 and totalDebt = 0. That corresponds to a case where debt
   * would represent an infinite amout of shares.
   */
  function _convertDebtToShares(
    uint256 debt,
    Math.Rounding rounding
  )
    internal
    view
    returns (uint256 shares)
  {
    uint256 supply = debtSharesSupply;
    return (debt == 0 || supply == 0) ? debt : debt.mulDiv(supply, totalDebt(), rounding);
  }

  /**
   * @dev Internal conversion function (from shares to debt) with support for rounding direction.
   */
  function _convertToDebt(
    uint256 shares,
    Math.Rounding rounding
  )
    internal
    view
    returns (uint256 assets)
  {
    uint256 supply = debtSharesSupply;
    return (supply == 0) ? shares : shares.mulDiv(totalDebt(), supply, rounding);
  }

  /**
   * @dev Borrow/mintDebtShares common workflow.
   */
  function _borrow(
    address caller,
    address receiver,
    address owner,
    uint256 assets,
    uint256 shares
  )
    internal
    whenNotPaused(VaultActions.Borrow)
  {
    _mintDebtShares(owner, shares);

    address asset = debtAsset();
    _executeProviderAction(assets, "borrow", activeProvider);

    SafeERC20.safeTransfer(IERC20(asset), receiver, assets);

    emit Borrow(caller, receiver, owner, assets, shares);
  }

  /**
   * @dev Payback/burnDebtShares common workflow.
   */
  function _payback(
    address caller,
    address owner,
    uint256 assets,
    uint256 shares
  )
    internal
    whenNotPaused(VaultActions.Payback)
  {
    address asset = debtAsset();
    SafeERC20.safeTransferFrom(IERC20(asset), caller, address(this), assets);

    _executeProviderAction(assets, "payback", activeProvider);

    _burnDebtShares(owner, shares);

    emit Payback(caller, owner, assets, shares);
  }

  function _mintDebtShares(address owner, uint256 amount) internal {
    debtSharesSupply += amount;
    _debtShares[owner] += amount;
  }

  function _burnDebtShares(address owner, uint256 amount) internal {
    uint256 balance = _debtShares[owner];
    require(balance >= amount, "Burn amount exceeds balance");
    unchecked {
      _debtShares[owner] = balance - amount;
    }
    debtSharesSupply -= amount;
  }

  ///////////////////
  /// Rebalancing ///
  ///////////////////

  // inheritdoc IVault
  function rebalance(
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    uint256 fee,
    bool setToAsActiveProvider
  )
    external
    hasRole(msg.sender, REBALANCER_ROLE)
    returns (bool)
  {
    if (!_isValidProvider(address(from)) || !_isValidProvider(address(to))) {
      revert BorrowingVault__rebalance_invalidProvider();
    }
    SafeERC20.safeTransferFrom(IERC20(debtAsset()), msg.sender, address(this), debt);
    _executeProviderAction(debt, "payback", from);
    _executeProviderAction(assets, "withdraw", from);

    _checkRebalanceFee(fee, debt);

    _executeProviderAction(assets, "deposit", to);
    _executeProviderAction(debt + fee, "borrow", to);
    SafeERC20.safeTransfer(IERC20(debtAsset()), msg.sender, debt + fee);

    if (setToAsActiveProvider) {
      _setActiveProvider(to);
    }

    emit VaultRebalance(assets, debt, address(from), address(to));
    return true;
  }

  //////////////////////
  ///  Liquidation  ////
  //////////////////////

  /// inheritdoc IVault
  function getHealthFactor(address owner) public view returns (uint256 healthFactor) {
    uint256 debtShares = _debtShares[owner];
    uint256 debt = convertToDebt(debtShares);

    if (debt == 0) {
      healthFactor = type(uint256).max;
    } else {
      uint256 assetShares = balanceOf(owner);
      uint256 assets = convertToAssets(assetShares);
      uint256 price = oracle.getPriceOf(debtAsset(), asset(), _debtDecimals);

      healthFactor = (assets * liqRatio * price) / (debt * 10 ** decimals());
    }
  }

  /// inheritdoc IVault
  function getLiquidationFactor(address owner) public view returns (uint256 liquidationFactor) {
    uint256 healthFactor = getHealthFactor(owner);

    if (healthFactor >= 1e18) {
      liquidationFactor = 0;
    } else if (FULL_LIQUIDATION_THRESHOLD < healthFactor) {
      liquidationFactor = DEFAULT_LIQUIDATION_CLOSE_FACTOR; // 50% of owner's debt
    } else {
      liquidationFactor = MAX_LIQUIDATION_CLOSE_FACTOR; // 100% of owner's debt
    }
  }

  /// inheritdoc IVault
  function liquidate(
    address owner,
    address receiver
  )
    public
    hasRole(msg.sender, LIQUIDATOR_ROLE)
    returns (uint256 gainedShares)
  {
    if (receiver == address(0)) {
      revert BorrowingVault__liquidate_invalidInput();
    }

    address caller = _msgSender();

    uint256 liquidationFactor = getLiquidationFactor(owner);
    if (liquidationFactor == 0) {
      revert BorrowingVault__liquidate_positionHealthy();
    }

    // Compute debt amount that should be paid by liquidator.
    uint256 debt = convertToDebt(_debtShares[owner]);
    uint256 debtSharesToCover = Math.mulDiv(_debtShares[owner], liquidationFactor, 1e18);
    uint256 debtToCover = Math.mulDiv(debt, liquidationFactor, 1e18);

    // Compute 'gainedShares' amount that the liquidator will receive.
    uint256 price = oracle.getPriceOf(debtAsset(), asset(), _debtDecimals);
    uint256 discountedPrice = Math.mulDiv(price, LIQUIDATION_PENALTY, 1e18);
    gainedShares = convertToShares(Math.mulDiv(debt, liquidationFactor, discountedPrice));

    _payback(caller, owner, debtToCover, debtSharesToCover);

    // Ensure liquidator receives no more shares than 'owner' owns.
    uint256 existingShares = balanceOf(owner);
    if (gainedShares > existingShares) {
      gainedShares = existingShares;
    }

    // Internal share adjusment between 'owner' and 'liquidator'.
    _burn(owner, gainedShares);
    _mint(receiver, gainedShares);

    emit Liquidate(caller, receiver, owner, gainedShares, debtToCover, price, liquidationFactor);
  }

  ///////////////////////////
  /// Admin set functions ///
  ///////////////////////////

  function setOracle(IFujiOracle newOracle) external onlyTimelock {
    if (address(newOracle) == address(0)) {
      revert BaseVault__setter_invalidInput();
    }
    oracle = newOracle;
    emit OracleChanged(newOracle);
  }

  /**
   * @dev Sets the maximum Loan-To-Value factor of this vault.
   * See factor:
   * https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme
   * Restrictions:
   * - SHOULD be at least 1%.
   */
  function setMaxLtv(uint256 maxLtv_) external onlyTimelock {
    if (maxLtv_ < 1e16) {
      revert BaseVault__setter_invalidInput();
    }
    maxLtv = maxLtv_;
    emit MaxLtvChanged(maxLtv);
  }

  /**
   * @dev Sets the Loan-To-Value liquidation threshold factor of this vault.
   * See factor:
   * https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme
   * Restrictions:
   * - SHOULD be greater than 'maxLTV'.
   */
  function setLiqRatio(uint256 liqRatio_) external onlyTimelock {
    if (liqRatio_ < maxLtv || liqRatio_ == 0) {
      revert BaseVault__setter_invalidInput();
    }
    liqRatio = liqRatio_;
    emit LiqRatioChanged(liqRatio);
  }
}
