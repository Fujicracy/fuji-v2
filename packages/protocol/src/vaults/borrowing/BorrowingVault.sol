// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {BaseVault} from "../../abstracts/BaseVault.sol";
import {VaultPermissions} from "../VaultPermissions.sol";

import "forge-std/console.sol";

contract BorrowingVault is BaseVault {
  using Math for uint256;
  using SafeERC20 for IERC20;

  error BorrowingVault__borrow_wrongInput();
  error BorrowingVault__borrow_notEnoughAssets();
  error BorrowingVault__payback_wrongInput();
  error BorrowingVault__payback_moreThanMax();

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
    console.log("inside borrow: caller", caller);
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

  /**
  * @dev Log when a user is liquidated
  */
  event Liquidate(
    address owner,
    uint256 amountCollateralSold, // naming review
    uint256 amountDebtPaid,
    address liquidator
  );

  // healthFactor
  function computeHealthFactor(address account) public returns (uint256 healthFactor) {
    uint256 debtShares = _debtShares[account];
    uint256 debt = convertToDebt(debtShares);
    
    if (debt == 0) {
      healthFactor = type(uint256).max;
    }
    else {
      uint256 assetShares = balanceOf(account);
      uint256 assets = convertToAssets(assetShares); // put in internal function
      uint256 price = oracle.getPriceOf(debtAsset(), asset(), _debtAsset.decimals());
      
      // healthFactor = (vars.totalCollateralInBaseCurrency.percentMul(vars.avgLiquidationThreshold)).wadDiv(
      // vars.totalDebtInBaseCurrency);

      healthFactor = (assets * maxLtv * price) / debt;

      // uint256 baseUserMaxBorrow =
      // ((assets * maxLtv.num * price) / (maxLtv.denum * 10 ** IERC20Metadata(asset()).decimals()));
    }
  }

  uint256 internal constant DEFAULT_LIQUIDATION_CLOSE_FACTOR = 0.5e4; // 0.5 might not compile in older solidty version
  uint256 public constant MAX_LIQUIDATION_CLOSE_FACTOR = 1e4;
  uint256 public constant CLOSE_FACTOR_HF_THRESHOLD = 0.95e18;

  function computeLiquidationFactor(address account) public returns (uint256 liquidationFactor) {
    uint256 healthFactor = computeHealthFactor(account);

    if (healthFactor >= 1) {
      liquidationFactor = 0;
    }
    else if (CLOSE_FACTOR_HF_THRESHOLD > healthFactor) {
      liquidationFactor = DEFAULT_LIQUIDATION_CLOSE_FACTOR; // 50%
    } 
    else {
      liquidationFactor = MAX_LIQUIDATION_CLOSE_FACTOR; // 100%
    }
  }

  function liquidate(address owner) public {
    address caller = _msgSender(); // liquidator

    // // Verify liquidation call
    uint256 liquidationFactor = computeLiquidationFactor(owner);
    require(liquidationFactor > 0, "Can't liquidate colleteral of this owner.");

    // // State change
    uint256 assetShares = balanceOf(owner);
    uint256 assets = convertToAssets(assetShares);

    uint256 debtShares = _debtShares[owner];
    uint256 debt = convertToDebt(debtShares);

    // uint256 assetSharesToLiquidate = mul(assetShares, liquidationFactor);
    // uint256 assetsToLiquidate = mul(assets, liquidationFactor); // are e4 magnitures correct in closing factor?

    uint256 price = oracle.getPriceOf(debtAsset(), asset(), _debtAsset.decimals());
    uint256 liquidationPenalty = 90; // in percent
    uint256 discountedPrice = Math.mulDiv(price, liquidationPenalty, 100);

    // How many assetshares to burn to cover debt?
    uint256 assetsLiquidator = debt / discountedPrice;

    // liquidationFactor determines whether 50% or 100% of colleteral is liquidated
    assetsLiquidator = assetsLiquidator * liquidationFactor;

    // turn into asset shares
    uint256 assetsLiquidatorShares = convertToShares(assetsLiquidator);

    // burn asset shares of owner
    _burn(owner, assetsLiquidatorShares);
    
    //mint same amount of asset shares for liquidator
    _mint(caller, assetsLiquidatorShares);

    // Liquidator (caller) pays back provider
    _payback(caller, owner, debt, debtShares); // TODO this depends on the liquidation closing factor

    //emit liquidation event
    emit Liquidate(
    owner,
    assetsLiquidatorShares,
    debt,
    caller
  );
  }    
}
