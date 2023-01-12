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
import {IERC4626} from "openzeppelin-contracts/contracts/interfaces/IERC4626.sol";
import {VaultPermissions} from "../vaults/VaultPermissions.sol";
import {SystemAccessControl} from "../access/SystemAccessControl.sol";
import {PausableVault} from "./PausableVault.sol";

abstract contract BaseVault is ERC20, SystemAccessControl, PausableVault, VaultPermissions, IVault {
  using Math for uint256;
  using Address for address;

  error BaseVault__constructor_invalidInput();
  error BaseVault__deposit_moreThanMax();
  error BaseVault__deposit_lessThanMin();
  error BaseVault__mint_moreThanMax();
  error BaseVault__mint_lessThanMin();
  error BaseVault__withdraw_invalidInput();
  error BaseVault__withdraw_moreThanMax();
  error BaseVault__redeem_moreThanMax();
  error BaseVault__redeem_invalidInput();
  error BaseVault__setter_invalidInput();
  error BaseVault__checkRebalanceFee_excessFee();
  error BaseVault__deposit_slippageTooHigh();
  error BaseVault__mint_slippageTooHigh();
  error BaseVault__withdraw_slippageTooHigh();
  error BaseVault__redeem_slippageTooHigh();

  /**
   * @dev `VERSION` of this vault.
   * Software versioning rules are followed: v-0.0.0
   *  v-MAJOR.MINOR.PATCH
   *  MAJOR version when you make incompatible ABI changes
   *  MINOR version when you add functionality in a backwards compatible manner.
   *  PATCH version when you make backwards compatible fixes.
   */
  string public constant VERSION = "v-0.0.0";

  IERC20Metadata internal _asset;

  uint8 private immutable _decimals;

  ILendingProvider[] internal _providers;
  ILendingProvider public activeProvider;

  uint256 public minAmount;
  uint256 public depositCap;

  constructor(
    address asset_,
    address chief_,
    string memory name_,
    string memory symbol_
  )
    ERC20(name_, symbol_)
    SystemAccessControl(chief_)
    VaultPermissions(name_)
  {
    if (asset_ == address(0) || chief_ == address(0)) {
      revert BaseVault__constructor_invalidInput();
    }
    _asset = IERC20Metadata(asset_);
    _decimals = _asset.decimals();
    depositCap = type(uint128).max;
    // To reduce initial deposit shares manipulation, the minimum deposit can't be < than this number.
    // refer to https://rokinot.github.io/hatsfinance
    minAmount = 1e6;
  }

  /*////////////////////////////////////////////////////
      Asset management: allowance-overrides IERC20 
      Overrides to handle all in withdrawAllowance
  ///////////////////////////////////////////////////*/

  /**
   * @dev Override to call {VaultPermissions-withdrawAllowance}.
   * Returns the share amount of VaultPermissions-withdrawAllowance.
   */
  function allowance(
    address owner,
    address receiver
  )
    public
    view
    override(ERC20, IERC20)
    returns (uint256)
  {
    address operator = receiver;
    return convertToShares(withdrawAllowance(owner, operator, receiver));
  }

  /**
   * @dev Override to call {VaultPermissions-_setWithdrawAllowance}.
   * Converts approve shares argument to assets in VaultPermissions-_withdrawAllowance.
   * Recommend to use increase/decrease methods see OZ notes for {IERC20-approve}.
   */
  function approve(address receiver, uint256 shares) public override(ERC20, IERC20) returns (bool) {
    address owner = _msgSender();
    address operator = receiver;
    _setWithdrawAllowance(owner, operator, receiver, convertToAssets(shares));
    return true;
  }

  /**
   * @dev Override to call {VaultPermissions-increaseWithdrawAllowance}.
   * Converts extraShares argument to assets in VaultPermissions-increaseWithdrawAllowance.
   */
  function increaseAllowance(address receiver, uint256 extraShares) public override returns (bool) {
    address operator = receiver;
    increaseWithdrawAllowance(operator, receiver, convertToAssets(extraShares));
    return true;
  }

  /**
   * @dev Override to call {VaultPermissions-decreaseWithdrawAllowance}.
   * Converts subtractedShares argument to assets in VaultPermissions-decreaseWithdrawAllowance.
   */
  function decreaseAllowance(
    address receiver,
    uint256 subtractedShares
  )
    public
    override
    returns (bool)
  {
    address operator = receiver;
    decreaseWithdrawAllowance(operator, receiver, convertToAssets(subtractedShares));
    return true;
  }

  /**
   * @dev Override to call {VaultPermissions-_spendWithdrawAllowance}.
   * Converts shares argument to assets in VaultPermissions-_spendWithdrawAllowance.
   * This internal function is called during ERC4626-transferFrom.
   */
  function _spendAllowance(
    address owner,
    address operator,
    address receiver,
    uint256 shares
  )
    internal
  {
    _spendWithdrawAllowance(owner, operator, receiver, convertToAssets(shares));
  }

  ////////////////////////////////////////////
  /// Asset management: overrides IERC4626 ///
  ////////////////////////////////////////////

  function decimals() public view virtual override(IERC20Metadata, ERC20) returns (uint8) {
    return _decimals;
  }

  /// @inheritdoc IERC4626
  function asset() public view virtual override returns (address) {
    return address(_asset);
  }

  /// @inheritdoc IERC4626
  function totalAssets() public view virtual override returns (uint256 assets) {
    return _checkProvidersBalance("getDepositBalance");
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
    return depositCap - totalAssets();
  }

  /// @inheritdoc IERC4626
  function maxMint(address) public view virtual override returns (uint256) {
    return _convertToShares(maxDeposit(address(0)), Math.Rounding.Down);
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
    return _convertToAssets(shares, Math.Rounding.Down);
  }

  /// @inheritdoc IERC4626
  function previewWithdraw(uint256 assets) public view virtual override returns (uint256) {
    return _convertToShares(assets, Math.Rounding.Down);
  }

  /// @inheritdoc IERC4626
  function previewRedeem(uint256 shares) public view virtual override returns (uint256) {
    return _convertToAssets(shares, Math.Rounding.Down);
  }

  /**
   * @notice Slippage protected `deposit` per EIP5143.
   * Refer to: https://eips.ethereum.org/EIPS/eip-5143
   * Requirements:
   * - MUST mint at least `minShares` when calling deposit().
   */
  function deposit(
    uint256 assets,
    address receiver,
    uint256 minShares
  )
    public
    virtual
    returns (uint256)
  {
    uint256 receivedShares = deposit(assets, receiver);
    if (receivedShares < minShares) {
      revert BaseVault__deposit_slippageTooHigh();
    }
    return receivedShares;
  }

  /// @inheritdoc IERC4626
  function deposit(uint256 assets, address receiver) public virtual override returns (uint256) {
    uint256 shares = previewDeposit(assets);

    // use shares because it's cheaper to get totalSupply compared to totalAssets
    if (shares + totalSupply() > maxMint(receiver)) {
      revert BaseVault__deposit_moreThanMax();
    }
    if (assets < minAmount) {
      revert BaseVault__deposit_lessThanMin();
    }

    _deposit(_msgSender(), receiver, assets, shares);

    return shares;
  }

  /**
   * @notice Slippage protected `mint` per EIP5143.
   * Refer to: https://eips.ethereum.org/EIPS/eip-5143
   * Requirements:
   * - MUST not pull more than `maxAssets` when calling mint().
   */
  function mint(
    uint256 shares,
    address receiver,
    uint256 maxAssets
  )
    public
    virtual
    returns (uint256)
  {
    uint256 pulledAssets = mint(shares, receiver);
    if (pulledAssets > maxAssets) {
      revert BaseVault__mint_slippageTooHigh();
    }
    return pulledAssets;
  }

  /// @inheritdoc IERC4626
  function mint(uint256 shares, address receiver) public virtual override returns (uint256) {
    uint256 assets = previewMint(shares);

    if (shares + totalSupply() > maxMint(receiver)) {
      revert BaseVault__mint_moreThanMax();
    }
    if (assets < minAmount) {
      revert BaseVault__mint_lessThanMin();
    }

    _deposit(_msgSender(), receiver, assets, shares);

    return assets;
  }

  /**
   * @notice Slippage protected `withdraw` per EIP5143.
   * Refer to: https://eips.ethereum.org/EIPS/eip-5143
   * Requirements:
   * - MUST not burn more than `maxShares` when calling withdraw().
   */
  function withdraw(
    uint256 assets,
    address receiver,
    address owner,
    uint256 maxShares
  )
    public
    virtual
    returns (uint256)
  {
    uint256 burnedShares = withdraw(assets, receiver, owner);
    // require(shares <= maxShares, "ERC5143: withdraw slippage protection");
    if (burnedShares > maxShares) {
      revert BaseVault__withdraw_slippageTooHigh();
    }
    return burnedShares;
  }

  /// @inheritdoc IERC4626
  function withdraw(
    uint256 assets,
    address receiver,
    address owner
  )
    public
    override
    returns (uint256)
  {
    if (assets == 0 || receiver == address(0) || owner == address(0)) {
      revert BaseVault__withdraw_invalidInput();
    }

    if (assets > maxWithdraw(owner)) {
      revert BaseVault__withdraw_moreThanMax();
    }

    address caller = _msgSender();
    if (caller != owner) {
      _spendAllowance(owner, caller, receiver, convertToShares(assets));
    }

    uint256 shares = previewWithdraw(assets);
    _withdraw(caller, receiver, owner, assets, shares);

    return shares;
  }

  /**
   * @notice Slippage protected `redeem` per EIP5143.
   * Refer to: https://eips.ethereum.org/EIPS/eip-5143
   * Requirements:
   * - MUST  receive at least `minAssets` when calling redeem().
   */
  function redeem(
    uint256 shares,
    address receiver,
    address owner,
    uint256 minAssets
  )
    public
    virtual
    returns (uint256)
  {
    uint256 receivedAssets = redeem(shares, receiver, owner);
    // require(assets >= minAssets, "ERC5143: redeem slippage protection");
    if (receivedAssets < minAssets) {
      revert BaseVault__redeem_slippageTooHigh();
    }
    return receivedAssets;
  }

  /// @inheritdoc IERC4626
  function redeem(
    uint256 shares,
    address receiver,
    address owner
  )
    public
    override
    returns (uint256)
  {
    if (shares == 0 || receiver == address(0) || owner == address(0)) {
      revert BaseVault__redeem_invalidInput();
    }

    if (shares > maxRedeem(owner)) {
      revert BaseVault__redeem_moreThanMax();
    }

    address caller = _msgSender();
    if (caller != owner) {
      _spendAllowance(owner, caller, receiver, shares);
    }

    uint256 assets = previewRedeem(shares);
    _withdraw(caller, receiver, owner, assets, shares);

    return assets;
  }

  /**
   * @dev Internal conversion function (from assets to shares) with support for rounding direction.
   *
   * Will revert if assets > 0, totalSupply > 0 and totalAssets = 0. That corresponds to a case where any asset
   * would represent an infinite amout of shares.
   */
  function _convertToShares(
    uint256 assets,
    Math.Rounding rounding
  )
    internal
    view
    virtual
    returns (uint256 shares)
  {
    uint256 supply = totalSupply();
    return (assets == 0 || supply == 0) ? assets : assets.mulDiv(supply, totalAssets(), rounding);
  }

  /**
   * @dev Internal conversion function (from shares to assets) with support for rounding direction.
   */
  function _convertToAssets(
    uint256 shares,
    Math.Rounding rounding
  )
    internal
    view
    virtual
    returns (uint256 assets)
  {
    uint256 supply = totalSupply();
    return (supply == 0) ? shares : shares.mulDiv(totalAssets(), supply, rounding);
  }

  /**
   * @dev Perform _deposit adding flow at provider {IERC4626-deposit}.
   */
  function _deposit(
    address caller,
    address receiver,
    uint256 assets,
    uint256 shares
  )
    internal
    whenNotPaused(VaultActions.Deposit)
  {
    SafeERC20.safeTransferFrom(IERC20(asset()), caller, address(this), assets);
    _executeProviderAction(assets, "deposit", activeProvider);
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
    whenNotPaused(VaultActions.Withdraw)
  {
    _burn(owner, shares);
    _executeProviderAction(assets, "withdraw", activeProvider);
    SafeERC20.safeTransfer(IERC20(asset()), receiver, assets);

    emit Withdraw(caller, receiver, owner, assets, shares);
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
  {}

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
  {}

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
  {}

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
    virtual
    override
  {}

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

  ////////////////////////////
  /// Fuji Vault functions ///
  ////////////////////////////

  function _executeProviderAction(
    uint256 assets,
    string memory name,
    ILendingProvider provider
  )
    internal
  {
    bytes memory data = abi.encodeWithSignature(
      string(abi.encodePacked(name, "(uint256,address)")), assets, address(this)
    );
    address(provider).functionDelegateCall(
      data, string(abi.encodePacked(name, ": delegate call failed"))
    );
  }

  function _checkProvidersBalance(string memory method) internal view returns (uint256 assets) {
    uint256 len = _providers.length;
    bytes memory callData = abi.encodeWithSignature(
      string(abi.encodePacked(method, "(address,address)")), address(this), address(this)
    );
    bytes memory returnedBytes;
    for (uint256 i = 0; i < len;) {
      returnedBytes = address(_providers[i]).functionStaticCall(callData, ": balance call failed");
      assets += uint256(bytes32(returnedBytes));
      unchecked {
        ++i;
      }
    }
  }

  /// Public getters.

  function getProviders() external view returns (ILendingProvider[] memory list) {
    list = _providers;
  }

  ///////////////////////////
  /// Admin set functions ///
  ///////////////////////////

  /// inheritdoc IVault
  function setProviders(ILendingProvider[] memory providers) external onlyTimelock {
    _setProviders(providers);
  }

  /// inheritdoc IVault
  function setActiveProvider(ILendingProvider activeProvider_) external override onlyTimelock {
    _setActiveProvider(activeProvider_);
  }

  /// inheritdoc IVault
  function setMinAmount(uint256 amount) external override onlyTimelock {
    minAmount = amount;
    emit MinAmountChanged(amount);
  }

  /// inheritdoc IVault
  function setDepositCap(uint256 newCap) external override onlyTimelock {
    if (newCap == 0 || newCap <= minAmount) {
      revert BaseVault__setter_invalidInput();
    }
    depositCap = newCap;
    emit DepositCapChanged(newCap);
  }

  /// inheritdoc PausableVault
  function pauseForceAll() external override hasRole(msg.sender, PAUSER_ROLE) {
    _pauseForceAllActions();
  }

  /// inheritdoc PausableVault
  function unpauseForceAll() external override hasRole(msg.sender, UNPAUSER_ROLE) {
    _unpauseForceAllActions();
  }

  /// inheritdoc PausableVault
  function pause(VaultActions action) external virtual override hasRole(msg.sender, PAUSER_ROLE) {
    _pause(action);
  }

  /// inheritdoc PausableVault
  function unpause(VaultActions action)
    external
    virtual
    override
    hasRole(msg.sender, UNPAUSER_ROLE)
  {
    _unpause(action);
  }

  /**
   * @dev implement at children level.
   */
  function _setProviders(ILendingProvider[] memory providers) internal virtual;

  function _setActiveProvider(ILendingProvider activeProvider_) internal {
    if (!_isValidProvider(address(activeProvider_))) {
      revert BaseVault__setter_invalidInput();
    }
    activeProvider = activeProvider_;
    emit ActiveProviderChanged(activeProvider_);
  }

  /**
   * @dev returns true if provider is in `_providers` array.
   * Since providers are not many use of array is fine.
   */
  function _isValidProvider(address provider) internal view returns (bool check) {
    uint256 len = _providers.length;
    for (uint256 i = 0; i < len;) {
      if (provider == address(_providers[i])) {
        check = true;
      }
      unchecked {
        ++i;
      }
    }
  }

  /**
   * @dev check rebalance fee is reasonable.
   *
   * Requirements:
   * - MUST be equal to or less than %0.10 (max 10 basis points) of `amount`.
   */
  function _checkRebalanceFee(uint256 fee, uint256 amount) internal pure {
    uint256 reasonableFee = (amount * 10) / 10000;
    if (fee > reasonableFee) {
      revert BaseVault__checkRebalanceFee_excessFee();
    }
  }
}
