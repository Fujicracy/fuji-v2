// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {BaseVault} from "../../abstracts/BaseVault.sol";
import {VaultPermissions} from "../VaultPermissions.sol";

contract BorrowingVault is BaseVault {
  using Math for uint256;
  using SafeERC20 for IERC20;

  /**
   * @dev Emitted when a user is liquidated
   * @param account address whose assets are being liquidated.
   * @param collateralSold `owner's` amount of collateral sold during liquidation.
   * @param debtPaid `owner's` amount of debt paid back during liquidation.
   * @param liquidator executor of liquidation.
   */
  event Liquidate(
    address indexed account, uint256 collateralSold, uint256 debtPaid, address liquidator
  );

  error BorrowingVault__borrow_wrongInput();
  error BorrowingVault__borrow_notEnoughAssets();
  error BorrowingVault__payback_wrongInput();
  error BorrowingVault__payback_moreThanMax();
  error BorrowingVault__liquidate_accountHealthy();

  /// Liquidation controls

  /// Returns default liquidation close factor: 50% of debt.
  uint256 public constant DEFAULT_LIQUIDATION_CLOSE_FACTOR = 0.5e18;
  /// Returns max liquidation close factor: 100% of debt.
  uint256 public constant MAX_LIQUIDATION_CLOSE_FACTOR = 1e18;
  /// Returns health factor threshold at which max liquidation can occur.
  uint256 public constant FULL_LIQUIDATION_THRESHOLD = 95;
  /// Returns the penalty factor at which collateral is sold during liquidation: 90% below oracle price.
  uint256 public constant LIQUIDATION_PENALTY = 0.9e18;

  constructor(address asset_, address debtAsset_, address oracle_, address chief_)
    BaseVault(
      asset_,
      debtAsset_,
      oracle_,
      chief_,
      // name_, ex: X-Fuji Dai Stablecoin Vault Shares
      string(abi.encodePacked("X-Fuji ", IERC20Metadata(asset_).name(), " Vault Shares")),
      // symbol_, ex: xfDAI
      string(abi.encodePacked("xf", IERC20Metadata(asset_).symbol()))
    )
  {}

  /////////////////////////////////
  /// Debt management overrides ///
  /////////////////////////////////

  /// @inheritdoc BaseVault
  function debtDecimals() public view override returns (uint8) {
    return _debtAsset.decimals();
  }

  /// @inheritdoc BaseVault
  function debtAsset() public view override returns (address) {
    return address(_debtAsset);
  }

  /// @inheritdoc BaseVault
  function balanceOfDebt(address account) public view override returns (uint256 debt) {
    return convertToDebt(_debtShares[account]);
  }

  /// @inheritdoc BaseVault
  function totalDebt() public view override returns (uint256) {
    return activeProvider.getBorrowBalance(debtAsset(), address(this));
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

  /// @inheritdoc BaseVault
  function borrow(uint256 debt, address receiver, address owner) public override returns (uint256) {
    address caller = _msgSender();
    if (caller != owner) {
      _spendBorrowAllowance(owner, caller, debt);
    }

    if (debt == 0) {
      revert BorrowingVault__borrow_wrongInput();
    }

    if (debt > maxBorrow(owner)) {
      revert BorrowingVault__borrow_notEnoughAssets();
    }

    uint256 shares = convertDebtToShares(debt);
    _borrow(caller, receiver, owner, debt, shares);

    return shares;
  }

  /// @inheritdoc BaseVault
  function payback(uint256 debt, address owner) public override returns (uint256) {
    if (debt == 0) {
      revert BorrowingVault__payback_wrongInput();
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
  function borrowAllowance(address owner, address spender)
    public
    view
    virtual
    override
    returns (uint256)
  {
    return VaultPermissions.borrowAllowance(owner, spender);
  }

  /**
   * @dev See {IVaultPermissions-decreaseborrowAllowance}.
   * Implement in {BorrowingVault}, revert in {LendingVault}
   */
  function increaseBorrowAllowance(address spender, uint256 byAmount)
    public
    virtual
    override
    returns (bool)
  {
    return VaultPermissions.increaseBorrowAllowance(spender, byAmount);
  }

  /**
   * @dev See {IVaultPermissions-decreaseborrowAllowance}.
   * Implement in {BorrowingVault}, revert in {LendingVault}
   */
  function decreaseBorrowAllowance(address spender, uint256 byAmount)
    public
    virtual
    override
    returns (bool)
  {
    return VaultPermissions.decreaseBorrowAllowance(spender, byAmount);
  }

  /**
   * @dev See {IVaultPermissions-permitBorrow}.
   * Implement in {BorrowingVault}, revert in {LendingVault}
   */
  function permitBorrow(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    public
    override
  {
    VaultPermissions.permitBorrow(owner, spender, value, deadline, v, r, s);
  }

  /// @inheritdoc BaseVault
  function _computeMaxBorrow(address borrower) internal view override returns (uint256 max) {
    uint256 price = oracle.getPriceOf(debtAsset(), asset(), _debtAsset.decimals());
    uint256 assetShares = balanceOf(borrower);
    uint256 assets = convertToAssets(assetShares);
    uint256 debtShares = _debtShares[borrower];
    uint256 debt = convertToDebt(debtShares);

    uint256 baseUserMaxBorrow =
      ((assets * maxLtv * price) / (1e18 * 10 ** IERC20Metadata(asset()).decimals()));
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
      uint256 price = oracle.getPriceOf(asset(), debtAsset(), IERC20Metadata(asset()).decimals());
      uint256 lockedAssets = (debt * 1e18 * price) / (maxLtv * 10 ** _debtAsset.decimals());
      uint256 assets = convertToAssets(balanceOf(owner));

      freeAssets = assets > lockedAssets ? assets - lockedAssets : 0;
    }
  }

  /**
   * @dev Internal conversion function (from debt to shares) with support for rounding direction.
   * Will revert if debt > 0, debtSharesSupply > 0 and totalDebt = 0. That corresponds to a case where debt
   * would represent an infinite amout of shares.
   */
  function _convertDebtToShares(uint256 debt, Math.Rounding rounding)
    internal
    view
    override
    returns (uint256 shares)
  {
    uint256 supply = debtSharesSupply;
    return
      (debt == 0 || supply == 0)
      ? debt.mulDiv(10 ** decimals(), 10 ** _debtAsset.decimals(), rounding)
      : debt.mulDiv(supply, totalDebt(), rounding);
  }

  /**
   * @dev Internal conversion function (from shares to debt) with support for rounding direction.
   */
  function _convertToDebt(uint256 shares, Math.Rounding rounding)
    internal
    view
    override
    returns (uint256 assets)
  {
    uint256 supply = debtSharesSupply;
    return
      (supply == 0)
      ? shares.mulDiv(10 ** _debtAsset.decimals(), 10 ** decimals(), rounding)
      : shares.mulDiv(totalDebt(), supply, rounding);
  }

  /**
   * @dev Borrow/mintDebtShares common workflow.
   */
  function _borrow(address caller, address receiver, address owner, uint256 assets, uint256 shares)
    internal
    override
  {
    _mintDebtShares(owner, shares);

    address asset = debtAsset();
    _executeProviderAction(asset, assets, "borrow");

    SafeERC20.safeTransfer(IERC20(asset), receiver, assets);

    emit Borrow(caller, receiver, owner, assets, shares);
  }

  /**
   * @dev Payback/burnDebtShares common workflow.
   */
  function _payback(address caller, address owner, uint256 assets, uint256 shares)
    internal
    override
  {
    address asset = debtAsset();
    SafeERC20.safeTransferFrom(IERC20(asset), caller, address(this), assets);

    _executeProviderAction(asset, assets, "payback");

    _burnDebtShares(owner, shares);

    emit Payback(caller, owner, assets, shares);
  }

  function _mintDebtShares(address account, uint256 amount) internal override {
    require(account != address(0), "Mint to the zero address");
    debtSharesSupply += amount;
    _debtShares[account] += amount;
  }

  function _burnDebtShares(address account, uint256 amount) internal override {
    require(account != address(0), "Mint to the zero address");
    uint256 accountBalance = _debtShares[account];
    require(accountBalance >= amount, "Burn amount exceeds balance");
    unchecked {
      _debtShares[account] = accountBalance - amount;
    }
    debtSharesSupply -= amount;
  }

  //////////////////////
  ///  Liquidate    ////
  //////////////////////

  /// inheritdoc IVault
  function getHealthFactor(address account) public view returns (uint256 healthFactor) {
    uint256 debtShares = _debtShares[account];
    uint256 debt = convertToDebt(debtShares);

    if (debt == 0) {
      healthFactor = type(uint256).max;
    } else {
      uint256 assetShares = balanceOf(account);
      uint256 assets = convertToAssets(assetShares);
      uint256 price = oracle.getPriceOf(debtAsset(), asset(), _debtAsset.decimals());

      healthFactor =
        (assets * maxLtv * price) / (debt * 1e16 * 10 ** IERC20Metadata(asset()).decimals());
    }
  }

  /// inheritdoc IVault
  function getLiquidationFactor(address account) public view returns (uint256 liquidationFactor) {
    uint256 healthFactor = getHealthFactor(account);

    if (healthFactor >= 100) {
      liquidationFactor = 0;
    } else if (FULL_LIQUIDATION_THRESHOLD < healthFactor) {
      liquidationFactor = DEFAULT_LIQUIDATION_CLOSE_FACTOR; // 50% of account's debt
    } else {
      liquidationFactor = MAX_LIQUIDATION_CLOSE_FACTOR; // 100% of account's debt
    }
  }

  /// inheritdoc IVault
  function liquidate(address account) public returns (uint256 gainedShares) {
    // TODO only liquidator role, that will be controlled at Chief level.

    address caller = _msgSender();

    uint256 liquidationFactor = getLiquidationFactor(account);
    if (liquidationFactor == 0) {
      revert BorrowingVault__liquidate_accountHealthy();
    }

    // Compute debt amount that should be paid by liquidator.
    uint256 debtShares = _debtShares[account];
    uint256 debt = convertToDebt(debtShares);
    uint256 debtSharesToCover = Math.mulDiv(debtShares, liquidationFactor, 1e18);
    uint256 debtToCover = Math.mulDiv(debt, liquidationFactor, 1e18);

    // Compute 'gainedShares' amount that the liquidator will receive.
    uint256 price = oracle.getPriceOf(debtAsset(), asset(), _debtAsset.decimals());
    uint256 discountedPrice = Math.mulDiv(price, LIQUIDATION_PENALTY, 1e18);
    uint256 gainedAssets = Math.mulDiv(debt, liquidationFactor, discountedPrice);
    gainedShares = convertToShares(gainedAssets);

    _payback(caller, account, debtToCover, debtSharesToCover);

    // Ensure liquidator receives no more shares than 'account' owns.
    uint256 existingShares = balanceOf(account);
    if (gainedShares > existingShares) {
      gainedShares = existingShares;
    }

    // Internal share adjusment between 'account' and 'liquidator'.
    _burn(account, gainedShares);
    _mint(caller, gainedShares);

    emit Liquidate(account, gainedShares, debtToCover, caller);
  }
}
