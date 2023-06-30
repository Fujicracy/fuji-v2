// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title BaseVault
 *
 * @author Fujidao Labs
 *
 * @notice Abstract contract that defines the basic common functions and interface
 * for all vault types. User state is kept in vaults via tokenized shares compliant to ERC4626.
 * BaseVault defines but does not implement the debt handling functions. Slippage protected
 * functions are available through ERC5143 extension. The `_providers` of this vault are the
 * liquidity source for lending, borrowing and/or yielding operations.
 * Setter functions are controlled by timelock, and roles defined in {SystemAccessControl}.
 * Pausability in core functions is implemented for emergency cases.
 * Allowance and approvals for value extracting operations  is possible via
 * signed messages defined in {VaultPermissions}.
 * A rebalancing function is implemented to move vault's funds across providers.
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

  /// @dev Custom Errors
  error BaseVault__constructor_invalidInput();
  error BaseVault__initializeVaultShares_alreadyInitialized();
  error BaseVault__initializeVaultShares_lessThanMin();
  error BaseVault__deposit_invalidInput();
  error BaseVault__deposit_moreThanMax();
  error BaseVault__deposit_lessThanMin();
  error BaseVault__withdraw_invalidInput();
  error BaseVault__withdraw_moreThanMax();
  error BaseVault__setter_invalidInput();
  error BaseVault__checkRebalanceFee_excessFee();
  error BaseVault__deposit_slippageTooHigh();
  error BaseVault__mint_slippageTooHigh();
  error BaseVault__withdraw_slippageTooHigh();
  error BaseVault__redeem_slippageTooHigh();

  /**
   *  @dev `VERSION` of this vault.
   * Software versioning rules are followed: v-0.0.0 (v-MAJOR.MINOR.PATCH)
   * Major version when you make incompatible ABI changes
   * Minor version when you add functionality in a backwards compatible manner.
   * Patch version when you make backwards compatible fixes.
   */
  string public constant VERSION = string("0.0.1");

  bool public initialized;

  IERC20Metadata internal immutable _asset;

  uint8 private immutable _decimals;

  ILendingProvider[] internal _providers;
  ILendingProvider public activeProvider;

  uint256 public minAmount;

  /**
   * @notice Constructor of a new {BaseVault}.
   *
   * @param asset_ this vault will handle as main asset (collateral)
   * @param chief_ that deploys and controls this vault
   * @param name_ of the token-shares handled in this vault
   * @param symbol_ of the token-shares handled in this vault
   *
   * @dev Requirements:
   * - Must assign `asset_` {ERC20-decimals} and `_decimals` equal.
   * - Must check initial `minAmount` is not < 1e6. Refer to https://rokinot.github.io/hatsfinance.
   */
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
    _decimals = IERC20Metadata(asset_).decimals();
    minAmount = 1e6;

    // @dev pause all actions that will be unpaused when initializing the vault
    _pauseForceAllActions();
  }

  /**
   * @notice Implement at children contract.
   *
   * @param assets amount to initialize asset shares
   * @param debt amount to initialize debt shares
   *
   * Requirements:
   * - Must create shares and balance to avoid inflation attack.
   * - Must have `assets` and `debt` be > `minAmount`.
   * - Must account any created shares to the {Chief.timelock()}.
   * - Must pull assets from msg.sender
   * - Must send debt if applicable to the {Chief.timelock()}.
   * - Must unpause all actions at the end.
   * - Must emit a VaultInitialized event.
   */
  function initializeVaultShares(uint256 assets, uint256 debt) external virtual;

  /*////////////////////////////////////////////////////
      Asset management: allowance {IERC20} overrides 
      Overrides to handle as `withdrawAllowance`
  ///////////////////////////////////////////////////*/

  /**
   * @notice Returns the shares amount allowed to transfer from
   *  `owner` to `receiver`.
   *
   * @param owner of the shares
   * @param receiver that can receive the shares
   *
   * @dev Requirements:
   * - Must be overriden to call {VaultPermissions-withdrawAllowance}.
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
    /// @dev operator = receiver
    return convertToShares(withdrawAllowance(owner, receiver, receiver));
  }

  /**
   * @notice Approve allowance of `shares` to `receiver`.
   *
   * @param receiver to whom share allowance is being set
   * @param shares amount of allowance
   *
   * @dev Recommend to use increase/decrease methods see OZ notes for {IERC20-approve}.
   * Requirements:
   * - Must be overriden to call {VaultPermissions-_setWithdrawAllowance}.
   * - Must convert `shares` into `assets` amount before calling internal functions.
   */
  function approve(address receiver, uint256 shares) public override(ERC20, IERC20) returns (bool) {
    /// @dev operator = receiver and owner = msg.sender
    _setWithdrawAllowance(msg.sender, receiver, receiver, convertToAssets(shares));
    return true;
  }

  /**
   * @notice Increase allowance of token-shares to `receiver` by `shares`.
   *
   * @param receiver to whom shares allowance is being increased
   * @param shares amount to increase allowance
   *
   * @dev Requirements:
   * - Must be overriden to call {VaultPermissions-increaseWithdrawAllowance}
   * - Must convert `shares` to `assets` amount before calling internal functions.
   *   VaultPermissions-increaseWithdrawAllowance.
   */
  function increaseAllowance(address receiver, uint256 shares) public override returns (bool) {
    /// @dev operator = receiver
    increaseWithdrawAllowance(receiver, receiver, convertToAssets(shares));
    return true;
  }

  /**
   * @notice Decrease allowance of token-shares to `receiver` by `shares`.
   *
   * @param receiver to whom shares allowance is decreased
   * @param shares amount to decrease allowance
   *
   * @dev Requirements:
   * - Must be overriden to call {VaultPermissions-decreaseWithdrawAllowance}.
   * - Must convert `shares` to `assets` before calling internal functions.
   */
  function decreaseAllowance(address receiver, uint256 shares) public override returns (bool) {
    /// @dev operator = receiver
    decreaseWithdrawAllowance(receiver, receiver, convertToAssets(shares));
    return true;
  }

  /**
   * @dev Called during {ERC20-transferFrom} to decrease allowance.
   * Requirements:
   * - Must be overriden to call {VaultPermissions-_spendWithdrawAllowance}.
   * - Must convert `shares` to `assets` before calling internal functions.
   * - Must assume msg.sender as the operator.
   *
   * @param owner of `shares`
   * @param spender to whom `shares` will be spent
   * @param shares amount to spend
   */
  function _spendAllowance(address owner, address spender, uint256 shares) internal override {
    _spendWithdrawAllowance(owner, msg.sender, spender, convertToAssets(shares));
  }

  /*//////////////////////////////////////////
      Asset management: overrides IERC4626
  //////////////////////////////////////////*/

  /**
   * @notice Returns the number of decimals used to get number representation.
   */
  function decimals() public view virtual override(IERC20Metadata, ERC20) returns (uint8) {
    return _decimals;
  }

  /// @inheritdoc IERC4626
  function asset() public view virtual override returns (address) {
    return address(_asset);
  }

  /// @inheritdoc IVault
  function balanceOfAsset(address owner) external view virtual override returns (uint256 assets) {
    return convertToAssets(balanceOf(owner));
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
    if (paused(VaultActions.Deposit)) {
      return 0;
    }
    return type(uint256).max;
  }

  /// @inheritdoc IERC4626
  function maxMint(address) public view virtual override returns (uint256) {
    if (paused(VaultActions.Deposit)) {
      return 0;
    }
    return type(uint256).max;
  }

  /// @inheritdoc IERC4626
  function maxWithdraw(address owner) public view virtual override returns (uint256);

  /// @inheritdoc IERC4626
  function maxRedeem(address owner) public view virtual override returns (uint256);

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

  /**
   * @notice Slippage protected `deposit()` per EIP5143.
   *
   * @param assets amount to be deposited
   * @param receiver to whom `assets` amount will be credited
   * @param minShares amount expected from this deposit action
   *
   * @dev Refer to https://eips.ethereum.org/EIPS/eip-5143.
   * Requirements:
   * - Must mint at least `minShares` when calling `deposit()`.
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

    _depositChecks(receiver, assets, shares);
    _deposit(msg.sender, receiver, assets, shares);

    return shares;
  }

  /**
   * @notice Slippage protected `mint()` per EIP5143.
   *
   * @param shares amount to mint
   * @param receiver to whom `shares` amount will be credited
   * @param maxAssets amount that must be credited when calling mint
   *
   * @dev Refer to https://eips.ethereum.org/EIPS/eip-5143.
   * Requirements:
   * - Must not pull more than `maxAssets` when calling `mint()`.
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

    _depositChecks(receiver, assets, shares);
    _deposit(msg.sender, receiver, assets, shares);

    return assets;
  }

  /**
   * @notice Slippage protected `withdraw()` per EIP5143.
   *
   * @param assets amount that is being withdrawn
   * @param receiver to whom `assets` amount will be transferred
   * @param owner to whom `assets` amount will be debited
   * @param maxShares amount that shall be burned when calling withdraw
   *
   * @dev Refer to https://eips.ethereum.org/EIPS/eip-5143.
   * Requirements:
   * - Must not burn more than `maxShares` when calling `withdraw()`.
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
    address caller = msg.sender;
    uint256 shares = previewWithdraw(assets);

    _withdrawChecks(caller, receiver, owner, assets, shares);
    _withdraw(caller, receiver, owner, assets, shares);

    return shares;
  }

  /**
   * @notice Slippage protected `redeem()` per EIP5143.
   *
   * @param shares amount that will be redeemed
   * @param receiver to whom asset equivalent of `shares` amount will be transferred
   * @param owner of the shares
   * @param minAssets amount that `receiver` must expect
   *
   * @dev Refer to https://eips.ethereum.org/EIPS/eip-5143.
   * Requirements:
   * - Must  receive at least `minAssets` when calling `redeem()`.
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
    address caller = msg.sender;
    uint256 assets = previewRedeem(shares);

    _withdrawChecks(caller, receiver, owner, assets, shares);
    _withdraw(caller, receiver, owner, assets, shares);

    return assets;
  }

  /**
   * @dev Conversion function from `assets` to shares equivalent with support for rounding direction.
   * Requirements:
   * - Must return zero if `assets` or `totalSupply()` == 0.
   * - Must revert if `totalAssets()` is not > 0.
   *   (Corresponds to a case where you divide by zero.)
   *
   * @param assets amount to convert to shares
   * @param rounding direction of division remainder
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
   * @dev Conversion function from `shares` to asset type with support for rounding direction.
   * Requirements:
   * - Must return zero if `totalSupply()` == 0.
   *
   * @param shares amount to convert to assets
   * @param rounding direction of division remainder
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
   * @dev Perform `_deposit()` at provider {IERC4626-deposit}.
   * Requirements:
   * - Must call `activeProvider` in `_executeProviderAction()`.
   * - Must emit a Deposit event.
   *
   * @param caller or {msg.sender}
   * @param receiver to whom `assets` are credited by `shares` amount
   * @param assets amount transferred during this deposit
   * @param shares amount credited to `receiver` during this deposit
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
   * @dev Runs common checks for all "deposit" or "mint" actions in this vault.
   * Requirements:
   * - Must revert for all conditions not passed.
   *
   * @param receiver of the deposit
   * @param assets being deposited
   * @param shares being minted for `receiver`
   */
  function _depositChecks(address receiver, uint256 assets, uint256 shares) private view {
    if (receiver == address(0) || assets == 0 || shares == 0) {
      revert BaseVault__deposit_invalidInput();
    }
    if (assets < minAmount) {
      revert BaseVault__deposit_lessThanMin();
    }
  }

  /**
   * @dev Perform `_withdraw()` at provider {IERC4626-withdraw}.
   * Requirements:
   * - Must call `activeProvider` in `_executeProviderAction()`.
   * - Must emit a Withdraw event.
   *
   * @param caller or {msg.sender}
   * @param receiver to whom `assets` amount will be transferred to
   * @param owner to whom `shares` will be burned
   * @param assets amount transferred during this withraw
   * @param shares amount burned to `owner` during this withdraw
   */
  function _withdraw(
    address caller,
    address receiver,
    address owner,
    uint256 assets,
    uint256 shares
  )
    internal
    virtual
    whenNotPaused(VaultActions.Withdraw)
  {
    _burn(owner, shares);
    _executeProviderAction(assets, "withdraw", activeProvider);
    SafeERC20.safeTransfer(IERC20(asset()), receiver, assets);

    emit Withdraw(caller, receiver, owner, assets, shares);
  }

  /**
   * @dev Runs common checks for all "withdraw" or "redeem" actions in this vault.
   * Requirements:
   * - Must revert for all conditions not passed.
   *
   * @param caller in msg.sender context
   * @param receiver of the withdrawn assets
   * @param owner of the withdrawn assets
   * @param assets being withdrawn
   * @param shares being burned for `owner`
   */
  function _withdrawChecks(
    address caller,
    address receiver,
    address owner,
    uint256 assets,
    uint256 shares
  )
    private
  {
    if (assets == 0 || shares == 0 || receiver == address(0) || owner == address(0)) {
      revert BaseVault__withdraw_invalidInput();
    }
    if (assets > maxWithdraw(owner)) {
      revert BaseVault__withdraw_moreThanMax();
    }
    if (caller != owner) {
      _spendWithdrawAllowance(owner, caller, receiver, assets);
    }
  }

  /*//////////////////////////////////////////////////
      Debt management: based on IERC4626 semantics
  //////////////////////////////////////////////////*/

  /// @inheritdoc IVault
  function debtDecimals() public view virtual override returns (uint8);

  /// @inheritdoc IVault
  function debtAsset() public view virtual returns (address);

  /// @inheritdoc IVault
  function balanceOfDebt(address account) public view virtual override returns (uint256 debt);

  /// @inheritdoc IVault
  function balanceOfDebtShares(address owner)
    external
    view
    virtual
    override
    returns (uint256 debtShares);

  /// @inheritdoc IVault
  function totalDebt() public view virtual returns (uint256);

  /// @inheritdoc IVault
  function convertDebtToShares(uint256 debt) public view virtual returns (uint256 shares);

  /// @inheritdoc IVault
  function convertToDebt(uint256 shares) public view virtual returns (uint256 debt);

  /// @inheritdoc IVault
  function maxBorrow(address borrower) public view virtual returns (uint256);

  /// @inheritdoc IVault
  function maxPayback(address borrower) public view virtual returns (uint256);

  /// @inheritdoc IVault
  function maxMintDebt(address borrower) public view virtual returns (uint256);

  /// @inheritdoc IVault
  function maxBurnDebt(address borrower) public view virtual returns (uint256);

  /// @inheritdoc IVault
  function previewBorrow(uint256 debt) public view virtual returns (uint256 shares);

  /// @inheritdoc IVault
  function previewMintDebt(uint256 shares) public view virtual returns (uint256 debt);

  /// @inheritdoc IVault
  function previewPayback(uint256 debt) public view virtual returns (uint256 shares);

  /// @inheritdoc IVault
  function previewBurnDebt(uint256 shares) public view virtual returns (uint256 debt);

  /// @inheritdoc IVault
  function borrow(
    uint256 debt,
    address receiver,
    address owner
  )
    public
    virtual
    returns (uint256 shares);

  /// @inheritdoc IVault
  function mintDebt(
    uint256 shares,
    address receiver,
    address owner
  )
    public
    virtual
    returns (uint256 debt);

  /// @inheritdoc IVault
  function payback(uint256 debt, address owner) public virtual returns (uint256 shares);

  /// @inheritdoc IVault
  function burnDebt(uint256 shares, address owner) public virtual returns (uint256 debt);

  /**
   * @notice Returns borrow allowance. See {IVaultPermissions-borrowAllowance}.
   *
   * @param owner that provides borrow allowance
   * @param operator who can process borrow allowance on owner's behalf
   * @param receiver who can spend borrow allowance
   *
   * @dev Requirements:
   * - Must be implemented in a {BorrowingVault}, and revert in a {YieldVault}.
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
   * @notice Increase borrow allowance. See {IVaultPermissions-decreaseborrowAllowance}.
   *
   * @param operator who can process borrow allowance on owner's behalf
   * @param receiver whom spending borrow allowance is increasing
   *
   * @dev Requirements:
   * - Must be immplemented in a {BorrowingVault}, and revert in a {YieldVault}.
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
   * @notice Decrease borrow allowance. See {IVaultPermissions-decreaseborrowAllowance}.
   *
   * @param operator address who can process borrow allowance on owner's behalf
   * @param receiver address whom spending borrow allowance is decreasing
   *
   * @dev Requirements:
   * - Must be implemented in a {BorrowingVault}, revert in a {YieldVault}.
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
   * @notice Process signed permit for borrow allowance. See {IVaultPermissions-permitBorrow}.
   *
   * @param owner address who signed this permit
   * @param receiver address whom spending borrow allowance will be set
   * @param value amount of borrow allowance
   * @param deadline timestamp at when this permit expires
   * @param actionArgsHash keccak256 of the abi.encoded(args,actions) to be performed in {BaseRouter._internalBundle}
   * @param v signature value
   * @param r signature value
   * @param s signature value
   *
   * @dev Requirements:
   * - Must be implemented in a {BorrowingVault}, revert in a {YieldVault}.
   */
  function permitBorrow(
    address owner,
    address receiver,
    uint256 value,
    uint256 deadline,
    bytes32 actionArgsHash,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    public
    virtual
    override
  {}

  /**
   * @dev Compute how much free 'assets' a user can withdraw or transfer
   * given their `balanceOfDebt()`.
   * Requirements:
   * - Must be implemented in {BorrowingVault} contract.
   * - Must not be implemented in a {YieldVault} contract.
   * - Must read price from {FujiOracle}.
   *
   * @param owner address to whom free assets is being checked
   */
  // function _computeFreeAssets(address owner) internal view virtual returns (uint256);

  /*//////////////////////////
      Fuji Vault functions
  //////////////////////////*/

  /**
   * @dev Execute an action at provider.
   *
   * @param assets amount handled in this action
   * @param name string of the method to call
   * @param provider to whom action is being called
   */
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

  /**
   * @dev Returns balance of `asset` or `debtAsset` of this vault at all
   * listed providers in `_providers` array.
   *
   * @param method string method to call: "getDepositBalance" or "getBorrowBalance".
   */
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

  /*////////////////////
      Public getters
  /////////////////////*/

  /**
   * @notice Returns the array of providers of this vault.
   */
  function getProviders() external view returns (ILendingProvider[] memory list) {
    list = _providers;
  }

  /*/////////////////////////
       Admin set functions
  /////////////////////////*/

  /// @inheritdoc IVault
  function setProviders(ILendingProvider[] memory providers) external onlyTimelock {
    _setProviders(providers);
  }

  /// @inheritdoc IVault
  function setActiveProvider(ILendingProvider activeProvider_) external override onlyTimelock {
    _setActiveProvider(activeProvider_);
  }

  /// @inheritdoc IVault
  function setMinAmount(uint256 amount) external override onlyTimelock {
    minAmount = amount;
    emit MinAmountChanged(amount);
  }

  /// @inheritdoc PausableVault
  function pauseForceAll() external override hasRole(msg.sender, PAUSER_ROLE) {
    _pauseForceAllActions();
  }

  /// @inheritdoc PausableVault
  function unpauseForceAll() external override hasRole(msg.sender, UNPAUSER_ROLE) {
    _unpauseForceAllActions();
  }

  /// @inheritdoc PausableVault
  function pause(VaultActions action) external virtual override hasRole(msg.sender, PAUSER_ROLE) {
    _pause(action);
  }

  /// @inheritdoc PausableVault
  function unpause(VaultActions action)
    external
    virtual
    override
    hasRole(msg.sender, UNPAUSER_ROLE)
  {
    _unpause(action);
  }

  /**
   * @dev Sets the providers of this vault.
   * Requirements:
   * - Must be implemented at {BorrowingVault} or {YieldVault} level.
   * - Must infinite approve erc20 transfers of `asset` or `debtAsset` accordingly.
   * - Must emit a ProvidersChanged event.
   *
   * @param providers array of addresses
   */
  function _setProviders(ILendingProvider[] memory providers) internal virtual;

  /**
   * @dev Sets the `activeProvider` of this vault.
   * Requirements:
   * - Must emit an ActiveProviderChanged event.
   *
   * @param activeProvider_ address to be set
   */
  function _setActiveProvider(ILendingProvider activeProvider_) internal {
    // @dev skip validity check when setting it for the 1st time
    if (!_isValidProvider(address(activeProvider_)) && address(activeProvider) != address(0)) {
      revert BaseVault__setter_invalidInput();
    }
    activeProvider = activeProvider_;
    emit ActiveProviderChanged(activeProvider_);
  }

  /**
   * @dev Returns true if `provider` is in `_providers` array.
   *
   * @param provider address
   */
  function _isValidProvider(address provider) internal view returns (bool check) {
    uint256 len = _providers.length;
    for (uint256 i = 0; i < len;) {
      if (provider == address(_providers[i])) {
        check = true;
        break;
      }
      unchecked {
        ++i;
      }
    }
  }

  /**
   * @dev Check rebalance fee is within 10 basis points.
   * Requirements:
   * - Must be equal to or less than %0.10 (max 10 basis points) of `amount`.
   *
   * @param fee amount to be checked
   * @param amount being rebalanced to check against
   */
  function _checkRebalanceFee(uint256 fee, uint256 amount) internal pure {
    uint256 reasonableFee = (amount * 10) / 10000;
    if (fee > reasonableFee) {
      revert BaseVault__checkRebalanceFee_excessFee();
    }
  }
}
