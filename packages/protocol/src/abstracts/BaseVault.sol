// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

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
import {VaultPermissions} from "../vaults/VaultPermissions.sol";

abstract contract BaseVault is ERC20, VaultPermissions, IVault {
  using Math for uint256;
  using Address for address;

  error BaseVault__deposit_moreThanMax();
  error BaseVault__mint_moreThanMax();
  error BaseVault__withdraw_wrongInput();
  error BaseVault__withdraw_moreThanMax();
  error BaseVault__redeem_moreThanMax();
  error BaseVault__redeem_wrongInput();
  error BaseVault__setter_invalidInput();

  address public immutable chief;

  IERC20Metadata internal immutable _asset;
  IERC20Metadata internal immutable _debtAsset;

  uint256 public debtSharesSupply;

  mapping(address => uint256) internal _debtShares;

  ILendingProvider[] internal _providers;
  ILendingProvider public activeProvider;

  IFujiOracle public oracle;

  uint256 public minDepositAmount;
  uint256 public depositCap;

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
    string memory symbol_
  )
    ERC20(name_, symbol_)
    VaultPermissions(name_)
  {
    _asset = IERC20Metadata(asset_);
    _debtAsset = IERC20Metadata(debtAsset_);
    oracle = IFujiOracle(oracle_);
    chief = chief_;
    maxLtv = 75 * 1e16;
    liqRatio = 80 * 1e16;
    depositCap = type(uint256).max;
  }

  /*////////////////////////////////////////////////////
      Asset management: allowance-overrides IERC20 
      Overrides to handle all in withdrawAllowance
  ///////////////////////////////////////////////////*/

  /**
   * @dev Override to call {VaultPermissions-withdrawAllowance}.
   * Returns the share amount of VaultPermissions-withdrawAllowance.
   */
  function allowance(address owner, address spender)
    public
    view
    override (ERC20, IERC20)
    returns (uint256)
  {
    return convertToShares(withdrawAllowance(owner, spender));
  }

  /**
   * @dev Override to call {VaultPermissions-_setWithdrawAllowance}.
   * Converts approve shares argument to assets in VaultPermissions-_withdrawAllowance.
   * Recommend to use increase/decrease methods see OZ notes for {IERC20-approve}.
   */
  function approve(address spender, uint256 shares) public override (ERC20, IERC20) returns (bool) {
    address owner = _msgSender();
    _setWithdrawAllowance(owner, spender, convertToAssets(shares));
    return true;
  }

  /**
   * @dev Override to call {VaultPermissions-increaseWithdrawAllowance}.
   * Converts extraShares argument to assets in VaultPermissions-increaseWithdrawAllowance.
   */
  function increaseAllowance(address spender, uint256 extraShares) public override returns (bool) {
    increaseWithdrawAllowance(spender, convertToAssets(extraShares));
    return true;
  }

  /**
   * @dev Override to call {VaultPermissions-decreaseWithdrawAllowance}.
   * Converts subtractedShares argument to assets in VaultPermissions-decreaseWithdrawAllowance.
   */
  function decreaseAllowance(address spender, uint256 subtractedShares)
    public
    override
    returns (bool)
  {
    decreaseWithdrawAllowance(spender, convertToAssets(subtractedShares));
    return true;
  }

  /**
   * @dev Override to call {VaultPermissions-_spendWithdrawAllowance}.
   * Converts shares argument to assets in VaultPermissions-_spendWithdrawAllowance.
   * This internal function is called during ERC4626-transferFrom.
   */
  function _spendAllowance(address owner, address spender, uint256 shares) internal override {
    _spendWithdrawAllowance(owner, spender, convertToAssets(shares));
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
    return _isVaultCollateralized() ? depositCap : 0;
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
    if (assets + totalAssets() > maxDeposit(receiver) || assets < minDepositAmount) {
      revert BaseVault__deposit_moreThanMax();
    }

    uint256 shares = previewDeposit(assets);
    _deposit(_msgSender(), receiver, assets, shares);

    return shares;
  }

  /// @inheritdoc IERC4626
  function mint(uint256 shares, address receiver) public virtual override returns (uint256) {
    if (shares > maxMint(receiver)) {
      revert BaseVault__mint_moreThanMax();
    }

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
    address caller = _msgSender();
    if (caller != owner) {
      _spendAllowance(owner, caller, convertToShares(assets));
    }

    if (assets == 0) {
      revert BaseVault__withdraw_wrongInput();
    }

    if (assets > maxWithdraw(owner)) {
      revert BaseVault__withdraw_moreThanMax();
    }

    uint256 shares = previewWithdraw(assets);
    _withdraw(caller, receiver, owner, assets, shares);

    return shares;
  }

  /// @inheritdoc IERC4626
  function redeem(uint256 shares, address receiver, address owner)
    public
    override
    returns (uint256)
  {
    address caller = _msgSender();
    if (caller != owner) {
      _spendAllowance(owner, caller, shares);
    }

    if (shares == 0) {
      revert BaseVault__redeem_wrongInput();
    }

    if (shares > maxRedeem(owner)) {
      revert BaseVault__redeem_moreThanMax();
    }

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
   * @dev Perform _deposit adding flow at provider {IERC4626-deposit}.
   */
  function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal {
    SafeERC20.safeTransferFrom(IERC20(asset()), caller, address(this), assets);
    _executeProviderAction(asset(), assets, "deposit");
    _mint(receiver, shares);

    emit Deposit(caller, receiver, assets, shares);
  }

  /**
   * @dev Perform _withdraw adding flow at provider {IERC4626-withdraw}.
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
    if (from != address(0)) {
      require(amount <= maxRedeem(from), "Transfer more than max");
    }
  }

  ////////////////////////////////////////////////////
  /// Debt management: based on IERC4626 semantics ///
  ////////////////////////////////////////////////////

  /// inheritdoc IVault
  function debtDecimals() public view virtual override returns (uint8);

  /// inheritdoc IVault
  function debtAsset() public view virtual returns (address);

  /// inheritdoc IVault
  function balanceOfDebt(address account) public view virtual override returns (uint256 debt);

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
  {}

  /**
   * @dev See {IVaultPermissions-decreaseborrowAllowance}.
   * Implement in {BorrowingVault}, revert in {LendingVault}
   */
  function increaseBorrowAllowance(address spender, uint256 byAmount)
    public
    virtual
    override
    returns (bool)
  {}

  /**
   * @dev See {IVaultPermissions-decreaseborrowAllowance}.
   * Implement in {BorrowingVault}, revert in {LendingVault}
   */
  function decreaseBorrowAllowance(address spender, uint256 byAmount)
    public
    virtual
    override
    returns (bool)
  {}

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
    virtual
    override
  {}

  /**
   * @dev Internal function that computes how much debt
   * a user can take against its 'asset' deposits.
   *
   * Requirements:
   * - SHOULD be implemented in {BorrowingVault} contract.
   * - SHOULD NOT be implemented in a {LendingVault} contract.
   * - SHOULD read price from {FujiOracle}.
   */
  function _computeMaxBorrow(address borrower) internal view virtual returns (uint256);

  /**
   * @dev Internal function that computes how much free 'assets'
   * a user can withdraw or transfer given their 'debt' balance.
   *
   * Requirements:
   * - SHOULD be implemented in {BorrowingVault} contract.
   * - SHOULD NOT be implemented in a {LendingVault} contract.
   * - SHOULD read price from {FujiOracle}.
   */
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
    bytes memory data = abi.encodeWithSignature(
      string(abi.encodePacked(name, "(address,uint256)")), assetAddr, assets
    );
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
  function setActiveProvider(ILendingProvider activeProvider_) external override {
    // TODO needs admin restriction
    if (address(activeProvider_) == address(0)) {
      revert BaseVault__setter_invalidInput();
    }
    activeProvider = activeProvider_;
    SafeERC20.safeApprove(
      IERC20(asset()), activeProvider.approvedOperator(asset()), type(uint256).max
    );
    if (debtAsset() != address(0)) {
      SafeERC20.safeApprove(
        IERC20(debtAsset()), activeProvider.approvedOperator(debtAsset()), type(uint256).max
      );
    }

    emit ActiveProviderChanged(activeProvider_);
  }

  /**
   * @dev Sets the Loan-To-Value liquidation threshold factor of this vault.
   * See factor:
   * https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme
   * Restrictions:
   * - SHOULD be greater than 'maxLTV'.
   */
  function setMaxLtv(uint256 maxLtv_) external {
    if (maxLtv_ < 1e16) {
      revert BaseVault__setter_invalidInput();
    }
    // TODO needs admin restriction
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
  function setLiqRatio(uint256 liqRatio_) external {
    if (liqRatio_ < maxLtv) {
      revert BaseVault__setter_invalidInput();
    }
    // TODO needs admin restriction
    liqRatio = liqRatio_;
    emit LiqRatioChanged(liqRatio);
  }

  /// inheritdoc IVault
  function setMinDepositAmount(uint256 amount) external override {
    // TODO needs admin restriction
    minDepositAmount = amount;
    emit MinDepositAmountChanged(liqRatio);
  }

  /// inheritdoc IVault
  function setDepositCap(uint256 newCap) external override {
    // TODO needs admin restriction
    if (newCap == 0 || newCap <= minDepositAmount) {
      revert BaseVault__setter_invalidInput();
    }
    depositCap = newCap;
    emit DepositCapChanged(newCap);
  }
}
