// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title BorrowingVault
 * @author Fujidao Labs
 *
 * @notice Implementation vault that handles pooled collateralized debt positions.
 * User state is kept at vaults via token-shares compliant to ERC4626, including
 * extension for debt asset and their equivalent debtshares.
 * Debt shares are not transferable.
 * Slippage protected functions include `borrow()` and `payback()`,
 * thru an implementation similar to ERC5143.
 * Setter functions for maximum loan-to-value and liquidation ratio factors
 * are defined and controlled by timelock.
 * A primitive liquidation function is implemented along additional view
 * functions to determine user's health factor.
 */

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IVault} from "../../interfaces/IVault.sol";
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

  /// @dev Custom errors
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

  /// @notice Returns default liquidation close factor: 50% of debt.
  uint256 public constant DEFAULT_LIQUIDATION_CLOSE_FACTOR = 0.5e18;

  /// @notice Returns max liquidation close factor: 100% of debt.
  uint256 public constant MAX_LIQUIDATION_CLOSE_FACTOR = 1e18;

  /// @notice Returns health factor threshold at which max liquidation can occur.
  uint256 public constant FULL_LIQUIDATION_THRESHOLD = 95e16;

  /// @notice Returns the penalty factor at which collateral is sold during liquidation: 90% below oracle price.
  uint256 public constant LIQUIDATION_PENALTY = 0.9e18;

  IERC20Metadata internal _debtAsset;
  uint8 internal immutable _debtDecimals;

  uint256 public debtSharesSupply;

  mapping(address => uint256) internal _debtShares;
  mapping(address => mapping(address => uint256)) private _borrowAllowances;

  IFujiOracle public oracle;

  /*
  Factors
  See: https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme
  */
  /// @notice Returns the factor defining the maximum loan-to-value
  /// a user can take in this vault.
  uint256 public maxLtv;

  /// @notice Returns the factor defining the loan-to-value at which
  /// a user can be liquidated.
  uint256 public liqRatio;

  /**
   * @notice Constructor of a new {BorrowingVault}.
   * Requirements:
   * - Must be initialized with a set of providers.
   * - Must set first provider in `providers_` array as `activeProvider`.
   * - Must initialize `maxLTV` and `liqRatio` with a non-zero value.
   * - `maxLTV` should < `liqRatio`.
   * - `debtAsset_` erc20-decimals and `_debtDecimals` of this vault should be equal.
   *
   * @param asset_ address this vault will handle as main asset (collateral).
   * @param debtAsset_ address this vault will handle as debt asset.
   * @param oracle_ address of {FujiOracle} implementation.
   * @param chief_ address that deploys and controls this vault.
   * @param name_ string of the token-shares handled in this vault.
   * @param symbol_ string of the token-shares handled in this vault.
   * @param providers_ address array that will initialize this vault.
   */
  constructor(
    address asset_,
    address debtAsset_,
    address oracle_,
    address chief_,
    string memory name_,
    string memory symbol_,
    ILendingProvider[] memory providers_
  )
    BaseVault(asset_, chief_, name_, symbol_)
  {
    _debtAsset = IERC20Metadata(debtAsset_);
    _debtDecimals = _debtAsset.decimals();

    oracle = IFujiOracle(oracle_);
    maxLtv = 75 * 1e16;
    liqRatio = 80 * 1e16;

    _setProviders(providers_);
    _setActiveProvider(providers_[0]);
  }

  receive() external payable {}

  /*///////////////////////////////
  /// Debt management overrides ///
  ///////////////////////////////*/

  /// @inheritdoc IVault
  function debtDecimals() public view override returns (uint8) {
    return _debtDecimals;
  }

  /// @inheritdoc IVault
  function debtAsset() public view override returns (address) {
    return address(_debtAsset);
  }

  /// @inheritdoc IVault
  function balanceOfDebt(address owner) public view override returns (uint256 debt) {
    return convertToDebt(_debtShares[owner]);
  }

  /// @inheritdoc IVault
  function totalDebt() public view override returns (uint256) {
    return _checkProvidersBalance("getBorrowBalance");
  }

  /// @inheritdoc IVault
  function convertDebtToShares(uint256 debt) public view override returns (uint256 shares) {
    return _convertDebtToShares(debt, Math.Rounding.Down);
  }

  /// @inheritdoc IVault
  function convertToDebt(uint256 shares) public view override returns (uint256 debt) {
    return _convertToDebt(shares, Math.Rounding.Down);
  }

  /// @inheritdoc IVault
  function maxBorrow(address borrower) public view override returns (uint256) {
    return _computeMaxBorrow(borrower);
  }

  /**
   * @notice Slippage protected `borrow` inspired by EIP5143.
   * Requirements:
   * - MUST mint maximum `maxDebtShares` when calling borrow().
   *
   * @param debt amount to borrow.
   * @param receiver address to whom borrowed amount will be transferred.
   * @param owner address who will incur the debt.
   * @param maxDebtShares amount that should be minted in this borrow call.
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
   *
   * @param debt amount to payback.
   * @param owner address whose debt will be reduced.
   * @param minDebtShares amount that should be burned in this payback call.
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

  /*///////////////////////
  /// Borrow allowances ///
  ///////////////////////*/

  /// @inheritdoc BaseVault
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

  /// @inheritdoc BaseVault
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

  /// @inheritdoc BaseVault
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

  /// @inheritdoc BaseVault
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
   * @dev Computes max borrow amount a user can take given their 'asset'
   * (collateral) balance and price.
   * Requirements:
   * - Should read price from {FujiOracle}.
   *
   * @param borrower address to whom to check max borrow amount.
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
   * @dev Conversion function from debt to `debtShares` with support for rounding direction.
   * Requirements:
   * - Must revert if debt > 0, debtSharesSupply > 0 and totalDebt = 0.
   *   (Corresponds to a case where you divide by zero.)
   * - Must return `debt` if `debtSharesSupply` == 0.
   *
   * @param debt amoun to convert to `debtShares`.
   * @param rounding direction of division remainder.
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
   * @dev Conversion function from `debtShares` to debt with support for rounding direction.
   * Requirements:
   * - Should return zero if `debtSharesSupply` == 0.
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
   * @dev Perform borrow action at provdier. Borrow/mintDebtShares common workflow.
   * Requirements:
   * - Must call `activeProvider` in `_executeProviderAction()`.
   * - Must emit a Borrow event.
   *
   * @param caller address of {msg.sender} / operator.
   * @param receiver address to whom borrowed amount is transferred.
   * @param owner address to whom `debtShares` get minted.
   * @param assets amount of debt.
   * @param shares amount of `debtShares`.
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
   * @dev Perform payback action at provider. Payback/burnDebtShares common workflow.
   * Requirements:
   * - Must call `activeProvider` in `_executeProviderAction()`.
   * - Must emit a Payback event.
   *
   * @param caller address {msg.sender}.
   * @param owner address to whom `debtShares` will bet burned.
   * @param assets amount of debt.
   * @param shares amount of `debtShares`.
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

  /*/////////////////
  /// Rebalancing ///
  /////////////////*/

  /// @inheritdoc IVault
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

  /*////////////////////
  ///  Liquidation  ////
  ////////////////////*/

  /// @inheritdoc IVault
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

  /// @inheritdoc IVault
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

  /// @inheritdoc IVault
  function liquidate(
    address owner,
    address receiver
  )
    external
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

  /*/////////////////////////
  /// Admin set functions ///
  /////////////////////////*/

  /**
   * @notice Sets `newOracle` address as the {FujiOracle} for this vault.
   * Requirements:
   * - Must NOT be address zero.
   * - Must emit a OracleChanged event.
   * - Must be called from a timelock.
   *
   * @param newOracle address.
   */
  function setOracle(IFujiOracle newOracle) external onlyTimelock {
    if (address(newOracle) == address(0)) {
      revert BaseVault__setter_invalidInput();
    }
    oracle = newOracle;
    emit OracleChanged(newOracle);
  }

  /**
   * @notice Sets the maximum loan-to-value factor of this vault.
   * Restrictions:
   * - SHOULD be at least 1% (1e16)
   *
   * @param maxLtv_ factor to be set.
   *
   *  @dev See factor:
   * https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme
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
   * Restrictions:
   * - SHOULD be greater than 'maxLTV'.
   *
   * @param liqRatio_ factor to be set.
   *
   * @dev See factor:
   * https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme
   */
  function setLiqRatio(uint256 liqRatio_) external onlyTimelock {
    if (liqRatio_ < maxLtv || liqRatio_ == 0) {
      revert BaseVault__setter_invalidInput();
    }
    liqRatio = liqRatio_;
    emit LiqRatioChanged(liqRatio);
  }

  /// @inheritdoc BaseVault
  function _setProviders(ILendingProvider[] memory providers) internal override {
    uint256 len = providers.length;
    for (uint256 i = 0; i < len;) {
      if (address(providers[i]) == address(0)) {
        revert BaseVault__setter_invalidInput();
      }
      IERC20(asset()).approve(
        providers[i].approvedOperator(asset(), asset(), debtAsset()), type(uint256).max
      );
      IERC20(debtAsset()).approve(
        providers[i].approvedOperator(debtAsset(), asset(), debtAsset()), type(uint256).max
      );
      unchecked {
        ++i;
      }
    }
    _providers = providers;

    emit ProvidersChanged(providers);
  }
}
