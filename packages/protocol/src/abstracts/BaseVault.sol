// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

/**
 * @title Abstract contract for all vaults.
 * @author Fujidao Labs
 * @notice Defines the interface and common functions for all vaults.
 */

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";
import {IVault} from "../interfaces/IVault.sol";
import {ILendingProvider} from "../interfaces/ILendingProvider.sol";
import {IFujiOracle} from "../interfaces/IFujiOracle.sol";
import {IERC4626} from "openzeppelin-contracts/contracts/interfaces/IERC4626.sol";

abstract contract BaseVault is ERC20, IVault {
  using Math for uint256;
  using Address for address;
  using SafeERC20 for IERC20;

  address public immutable chief;

  IERC20Metadata internal immutable _asset;
  IERC20Metadata internal immutable _debtAsset;

  uint256 public debtSharesSupply;

  mapping(address => uint256) internal _debtShares;

  ILendingProvider[] internal _providers;
  ILendingProvider public activeProvider;

  IFujiOracle public oracle;

  Factor public maxLtv = Factor(75, 100);

  Factor public liqRatio = Factor(5, 100);

  constructor(address asset_, address debtAsset_, address oracle_, address chief_)
    // ex: X-Fuji Dai Stablecoin Vault Shares
    ERC20(
      string(abi.encodePacked("X-Fuji ", IERC20Metadata(asset_).name(), " Vault Shares")),
      // ex: xfDAI
      string(abi.encodePacked("xf", IERC20Metadata(asset_).symbol()))
    )
  {
    _asset = IERC20Metadata(asset_);
    _debtAsset = IERC20Metadata(debtAsset_);
    oracle = IFujiOracle(oracle_);
    chief = chief_;
  }

  ////////////////////////////////////////////
  /// Asset management: overrides IERC4626 ///
  ////////////////////////////////////////////

  /// @inheritdoc IERC4626
  function asset() public view virtual override returns (address) {
    return address(_asset);
  }

  /// @inheritdoc IERC4626
  function totalAssets() public view virtual override returns (uint256) {
    return activeProvider.getDepositBalance(asset(), address(this));
  }

  /// @inheritdoc IERC4626
  function convertToShares(uint256 assets) public view virtual override returns (uint256 shares) {
    return _convertToShares(assets, Math.Rounding.Down);
  }

  /// @inheritdoc IERC4626
  function convertToAssets(uint256 shares) public view virtual override returns (uint256 assets) {
    return _convertToAssets(shares, Math.Rounding.Down);
  }

  /// @inheritdoc IERC4626
  function maxDeposit(address) public view virtual override returns (uint256) {
    return _isVaultCollateralized() ? type(uint256).max : 0;
  }

  /// @inheritdoc IERC4626
  function maxMint(address) public view virtual override returns (uint256) {
    return type(uint256).max;
  }

  /// @inheritdoc IERC4626
  function maxWithdraw(address owner) public view override returns (uint256) {
    return _computeFreeAssets(owner);
  }

  /// @inheritdoc IERC4626
  function maxRedeem(address owner) public view override returns (uint256) {
    return _convertToShares(_computeFreeAssets(owner), Math.Rounding.Down);
  }

  /// @inheritdoc IERC4626
  function previewDeposit(uint256 assets) public view virtual override returns (uint256) {
    return _convertToShares(assets, Math.Rounding.Down);
  }

  /// @inheritdoc IERC4626
  function previewMint(uint256 shares) public view virtual override returns (uint256) {
    return _convertToAssets(shares, Math.Rounding.Up);
  }

  /// @inheritdoc IERC4626
  function previewWithdraw(uint256 assets) public view virtual override returns (uint256) {
    return _convertToShares(assets, Math.Rounding.Up);
  }

  /// @inheritdoc IERC4626
  function previewRedeem(uint256 shares) public view virtual override returns (uint256) {
    return _convertToAssets(shares, Math.Rounding.Down);
  }

  /// @inheritdoc IERC4626
  function deposit(uint256 assets, address receiver) public virtual override returns (uint256) {
    require(assets <= maxDeposit(receiver), "ERC4626: deposit more than max");

    uint256 shares = previewDeposit(assets);
    _deposit(_msgSender(), receiver, assets, shares);

    return shares;
  }

  /// @inheritdoc IERC4626
  function mint(uint256 shares, address receiver) public virtual override returns (uint256) {
    require(shares <= maxMint(receiver), "ERC4626: mint more than max");

    uint256 assets = previewMint(shares);
    _deposit(_msgSender(), receiver, assets, shares);

    return assets;
  }

  /// @inheritdoc IERC4626
  function withdraw(uint256 assets, address receiver, address owner)
    public
    override
    returns (uint256)
  {
    require(assets > 0, "Wrong input");
    require(assets <= maxWithdraw(owner), "Withdraw more than max");

    uint256 shares = previewWithdraw(assets);
    _withdraw(_msgSender(), receiver, owner, assets, shares);

    return shares;
  }

  /// @inheritdoc IERC4626
  function redeem(uint256 shares, address receiver, address owner)
    public
    override
    returns (uint256)
  {
    require(shares <= maxRedeem(owner), "Redeem more than max");

    uint256 assets = previewRedeem(shares);
    _withdraw(_msgSender(), receiver, owner, assets, shares);

    return assets;
  }

  /**
   * @dev Internal conversion function (from assets to shares) with support for rounding direction.
   *
   * Will revert if assets > 0, totalSupply > 0 and totalAssets = 0. That corresponds to a case where any asset
   * would represent an infinite amout of shares.
   */
  function _convertToShares(uint256 assets, Math.Rounding rounding)
    internal
    view
    virtual
    returns (uint256 shares)
  {
    uint256 supply = totalSupply();
    return
      (assets == 0 || supply == 0)
      ? assets.mulDiv(10 ** decimals(), 10 ** _asset.decimals(), rounding)
      : assets.mulDiv(supply, totalAssets(), rounding);
  }

  /**
   * @dev Internal conversion function (from shares to assets) with support for rounding direction.
   */
  function _convertToAssets(uint256 shares, Math.Rounding rounding)
    internal
    view
    virtual
    returns (uint256 assets)
  {
    uint256 supply = totalSupply();
    return
      (supply == 0)
      ? shares.mulDiv(10 ** _asset.decimals(), 10 ** decimals(), rounding)
      : shares.mulDiv(totalAssets(), supply, rounding);
  }

  /**
   * @dev Overriden to perform _deposit adding flow at lending provider {IERC4626-deposit}.
   */
  function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal {
    SafeERC20.safeTransferFrom(IERC20(asset()), caller, address(this), assets);
    _executeProviderAction(asset(), assets, "deposit");
    _mint(receiver, shares);

    emit Deposit(caller, receiver, assets, shares);
  }

  /**
   * @dev Overriden to perform _withdraw adding flow at lending provider {IERC4626-withdraw}.
   */
  function _withdraw(
    address caller,
    address receiver,
    address owner,
    uint256 assets,
    uint256 shares
  )
    internal
  {
    if (caller != owner) {
      _spendAllowance(owner, caller, shares);
    }

    _burn(owner, shares);
    _executeProviderAction(asset(), assets, "withdraw");
    SafeERC20.safeTransfer(IERC20(asset()), receiver, assets);

    emit Withdraw(caller, receiver, owner, assets, shares);
  }

  function _isVaultCollateralized() private view returns (bool) {
    return totalAssets() > 0 || totalSupply() == 0;
  }

  /// @inheritdoc ERC20
  function _beforeTokenTransfer(address from, address to, uint256 amount) internal view override {
    to;
    if (from != address(0)) require(amount <= maxRedeem(from), "Transfer more than max");
  }

  ////////////////////////////////////////////////////
  /// Debt management: based on IERC4626 semantics ///
  ////////////////////////////////////////////////////

  /// inheritdoc IVault
  function debtDecimals() public view virtual override returns (uint8);

  /// inheritdoc IVault
  function debtAsset() public view virtual returns (address);

  /// inheritdoc IVault
  function totalDebt() public view virtual returns (uint256);

  /// inheritdoc IVault
  function convertDebtToShares(uint256 debt) public view virtual returns (uint256 shares);

  /// inheritdoc IVault
  function convertToDebt(uint256 shares) public view virtual returns (uint256 debt);

  /// inheritdoc IVault
  function maxBorrow(address borrower) public view virtual returns (uint256);

  /// inheritdoc IVault
  function borrow(uint256 debt, address receiver, address owner) public virtual returns (uint256);

  /// inheritdoc IVault
  function payback(uint256 debt, address owner) public virtual returns (uint256);

  function _computeMaxBorrow(address borrower) internal view virtual returns (uint256);

  function _computeFreeAssets(address owner) internal view virtual returns (uint256);

  /**
   * @dev Internal conversion function (from debt to shares) with support for rounding direction.
   * Will revert if debt > 0, debtSharesSupply > 0 and totalDebt = 0. That corresponds to a case where debt
   * would represent an infinite amout of shares.
   */
  function _convertDebtToShares(uint256 debt, Math.Rounding rounding)
    internal
    view
    virtual
    returns (uint256);

  /**
   * @dev Internal conversion function (from shares to debt) with support for rounding direction.
   */
  function _convertToDebt(uint256 shares, Math.Rounding rounding)
    internal
    view
    virtual
    returns (uint256);

  /**
   * @dev Borrow/mintDebtShares common workflow.
   */
  function _borrow(address caller, address receiver, address owner, uint256 assets, uint256 shares)
    internal
    virtual;

  /**
   * @dev Payback/burnDebtShares common workflow.
   */
  function _payback(address caller, address owner, uint256 assets, uint256 shares) internal virtual;

  function _mintDebtShares(address account, uint256 amount) internal virtual;

  function _burnDebtShares(address account, uint256 amount) internal virtual;

  ////////////////////////////
  /// Fuji Vault functions ///
  ////////////////////////////

  function _executeProviderAction(address assetAddr, uint256 assets, string memory name) internal {
    bytes memory data =
      abi.encodeWithSignature(string(abi.encodePacked(name, "(address,uint256)")), assetAddr, assets);
    address(activeProvider).functionDelegateCall(
      data, string(abi.encodePacked(name, ": delegate call failed"))
    );
  }

  /// Public getters.

  function getProviders() external view returns (ILendingProvider[] memory list) {
    list = _providers;
  }

  ///////////////////////////
  /// Admin set functions ///
  ///////////////////////////

  function setOracle(IFujiOracle newOracle) external {
    // TODO needs admin restriction
    // TODO needs input validation
    oracle = newOracle;

    emit OracleChanged(newOracle);
  }

  function setProviders(ILendingProvider[] memory providers) external {
    // TODO needs admin restriction
    // TODO needs input validation
    _providers = providers;

    emit ProvidersChanged(providers);
  }

  /// inheritdoc IVault
  function setActiveProvider(ILendingProvider activeProvider_) external {
    // TODO needs admin restriction
    // TODO needs input validation
    activeProvider = activeProvider_;
    SafeERC20.safeApprove(
      IERC20(asset()), activeProvider.approvedOperator(asset()), type(uint256).max
    );
    if (debtAsset() != address(0)) SafeERC20.safeApprove(
      IERC20(debtAsset()), activeProvider.approvedOperator(debtAsset()), type(uint256).max
    );

    emit ActiveProviderChanged(activeProvider_);
  }

  function setMaxLtv(Factor calldata maxLtv_) external {
    // TODO needs admin restriction
    // TODO needs input validation
    maxLtv = maxLtv_;

    emit MaxLtvChanged(maxLtv_);
  }

  function setLiqRatio(Factor calldata liqRatio_) external {
    // TODO needs admin restriction
    // TODO needs input validation
    liqRatio = liqRatio_;

    emit LiqRatioChanged(liqRatio_);
  }
}
