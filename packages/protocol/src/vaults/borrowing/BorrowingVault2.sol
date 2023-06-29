// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title BorrowingVault
 *
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
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {BaseVault} from "../../abstracts/BaseVault.sol";
import {VaultPermissions} from "../VaultPermissions.sol";

contract BorrowingVault2 is BaseVault {
  using Math for uint256;

  /**
   * @dev Emitted when a user is liquidated.
   *
   * @param caller of liquidation
   * @param receiver of liquidation bonus
   * @param owner whose assets are being liquidated
   * @param collateralSold `owner`'s amount of collateral sold during liquidation
   * @param debtPaid `owner`'s amount of debt paid back during liquidation
   * @param price price of collateral at which liquidation was done
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
  error BorrowingVault__beforeTokenTransfer_moreThanMax();
  error BorrowingVault__liquidate_invalidInput();
  error BorrowingVault__liquidate_positionHealthy();
  error BorrowingVault__rebalance_invalidProvider();
  error BorrowingVault__borrow_slippageTooHigh();
  error BorrowingVault__mintDebt_slippageTooHigh();
  error BorrowingVault__payback_slippageTooHigh();
  error BorrowingVault__burnDebt_slippageTooHigh();
  error BorrowingVault__burnDebtShares_amountExceedsBalance();
  error BorrowingVault__correctDebt_noNeedForCorrection();
  error BorrowingVault__initializeVaultShares_assetDebtRatioExceedsMaxLtv();

  /*///////////////////
   Liquidation controls
  ////////////////////*/

  /// @notice Returns default liquidation close factor: 50% of debt.
  uint256 public constant DEFAULT_LIQUIDATION_CLOSE_FACTOR = 0.5e18;

  /// @notice Returns max liquidation close factor: 100% of debt.
  uint256 public constant MAX_LIQUIDATION_CLOSE_FACTOR = 1e18;

  /// @notice Returns health factor threshold at which max liquidation can occur.
  uint256 public constant FULL_LIQUIDATION_THRESHOLD = 95e16;

  /// @notice Returns the penalty factor at which collateral is sold during liquidation: 90% below oracle price.
  uint256 public constant LIQUIDATION_PENALTY = 0.9e18;

  IERC20Metadata internal immutable _debtAsset;
  uint8 internal immutable _debtDecimals;

  uint256 public debtSharesSupply;

  mapping(address => uint256) internal _debtShares;

  IFujiOracle public oracle;

  /**
   * @dev Factor See: https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme
   */

  /// @notice Returns the factor defining the maximum loan-to-value a user can take in this vault.
  uint256 public maxLtv;

  /// @notice Returns the factor defining the loan-to-value at which a user can be liquidated.
  uint256 public liqRatio;

  /**
   * @notice Constructor of a new {BorrowingVault}.
   *
   * @param asset_ this vault will handle as main asset (collateral)
   * @param debtAsset_ this vault will handle as debt asset
   * @param chief_ that deploys and controls this vault
   * @param name_ string of the token-shares handled in this vault
   * @param symbol_ string of the token-shares handled in this vault
   */
  constructor(
    address asset_,
    address debtAsset_,
    address chief_,
    string memory name_,
    string memory symbol_
  )
    BaseVault(asset_, chief_, name_, symbol_)
  {
    _debtAsset = IERC20Metadata(debtAsset_);
    _debtDecimals = IERC20Metadata(debtAsset_).decimals();
  }

  receive() external payable {}

  /// @inheritdoc BaseVault
  function initializeVaultShares(uint256 assets, uint256 debt) external override {
    if (initialized) {
      revert BaseVault__initializeVaultShares_alreadyInitialized();
    } else if (assets < minAmount || debt < minAmount) {
      revert BaseVault__initializeVaultShares_lessThanMin();
    }
    _unpauseForceAllActions();

    uint256 price = oracle.getPriceOf(debtAsset(), asset(), _debtDecimals);

    uint256 maxBorrow_ = (assets * maxLtv * price) / (1e18 * 10 ** decimals());
    if (debt > maxBorrow_) {
      revert BorrowingVault__initializeVaultShares_assetDebtRatioExceedsMaxLtv();
    }
    address timelock = chief.timelock();
    _deposit(msg.sender, timelock, assets, assets);
    _borrow(msg.sender, timelock, timelock, debt, debt);

    initialized = true;
    emit VaultInitialized(msg.sender);
  }

  /*///////////////////////////////
  /// Debt management overrides ///
  ///////////////////////////////*/

  /**
   * @dev Hook before all asset-share transfers.
   * Requirements:
   * - Must check `from` can move `amount` of shares.
   *
   * @param from address
   * @param to address
   * @param amount of shares
   */
  function _beforeTokenTransfer(address from, address to, uint256 amount) internal view override {
    /**
     * @dev Hook check activated only when called by OZ {ERC20-_transfer}
     * User must not be able to transfer asset-shares locked as collateral
     */
    if (from != address(0) && to != address(0)) {
      if (amount > maxRedeem(from)) {
        revert BorrowingVault__beforeTokenTransfer_moreThanMax();
      }
    }
  }

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
  function balanceOfDebtShares(address owner) external view override returns (uint256 debtShares) {
    return _debtShares[owner];
  }

  /// @inheritdoc IVault
  function totalDebt() public view override returns (uint256) {
    return _checkProvidersBalance("getBorrowBalance");
  }

  /// @inheritdoc IVault
  function convertDebtToShares(uint256 debt) public view override returns (uint256 shares) {
    return _convertDebtToShares(debt, Math.Rounding.Up);
  }

  /// @inheritdoc IVault
  function convertToDebt(uint256 shares) public view override returns (uint256 debt) {
    return _convertToDebt(shares, Math.Rounding.Up);
  }

  /// @inheritdoc IVault
  function maxBorrow(address borrower) public view override returns (uint256) {
    if (paused(VaultActions.Borrow)) {
      return 0;
    }
    return _computeMaxBorrow(borrower);
  }

  /// @inheritdoc IVault
  function maxPayback(address borrower) public view override returns (uint256) {
    if (paused(VaultActions.Payback)) {
      return 0;
    }
    return previewBurnDebt(maxBurnDebt(borrower));
  }

  /// @inheritdoc IVault
  function maxMintDebt(address borrower) public view override returns (uint256) {
    if (paused(VaultActions.Borrow)) {
      return 0;
    }
    return convertDebtToShares(maxBorrow(borrower));
  }

  /// @inheritdoc IVault
  function maxBurnDebt(address borrower) public view override returns (uint256) {
    if (paused(VaultActions.Payback)) {
      return 0;
    }
    return _debtShares[borrower];
  }

  /// @inheritdoc IVault
  function previewBorrow(uint256 debt) public view override returns (uint256 shares) {
    return _convertDebtToShares(debt, Math.Rounding.Up);
  }

  /// @inheritdoc IVault
  function previewMintDebt(uint256 shares) public view override returns (uint256 debt) {
    return _convertToDebt(shares, Math.Rounding.Down);
  }

  /// @inheritdoc IVault
  function previewPayback(uint256 debt) public view override returns (uint256 shares) {
    return _convertDebtToShares(debt, Math.Rounding.Down);
  }

  /// @inheritdoc IVault
  function previewBurnDebt(uint256 shares) public view override returns (uint256 debt) {
    return _convertToDebt(shares, Math.Rounding.Up);
  }

  /// @inheritdoc BaseVault
  function borrow(uint256 debt, address receiver, address owner) public override returns (uint256) {
    address caller = msg.sender;

    uint256 shares = previewBorrow(debt);
    _borrowChecks(caller, receiver, owner, debt, shares);
    _borrow(caller, receiver, owner, debt, shares);

    return shares;
  }

  /// @inheritdoc BaseVault
  function mintDebt(
    uint256 shares,
    address receiver,
    address owner
  )
    public
    override
    returns (uint256)
  {
    uint256 debt = previewMintDebt(shares);
    address caller = msg.sender;

    _borrowChecks(caller, receiver, owner, debt, shares);
    _borrow(caller, receiver, owner, debt, shares);

    return debt;
  }

  /// @inheritdoc BaseVault
  function payback(uint256 debt, address owner) public override returns (uint256) {
    uint256 shares = previewPayback(debt);

    shares = _paybackChecks(owner, debt, shares);
    _payback(msg.sender, owner, debt, shares);

    return shares;
  }

  /// @inheritdoc BaseVault
  function burnDebt(uint256 shares, address owner) public override returns (uint256) {
    uint256 debt = previewBurnDebt(shares);

    shares = _paybackChecks(owner, debt, shares);
    _payback(msg.sender, owner, debt, shares);

    return debt;
  }

  /**
   * @dev Checks if vault debt has been paid off externally and pauses the vault if so.
   * Will call withdraw if normal conditions are met.
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
    override
    whenNotPaused(VaultActions.Withdraw)
  {
    uint256 totalDebt_ = totalDebt();
    uint256 supply = debtSharesSupply;

    if (totalDebt_ == 0 && supply > 0 && supply > totalDebt_) {
      _pause(VaultActions.Withdraw);
    }
    super._withdraw(caller, receiver, owner, assets, shares);
  }

  /*///////////////////////
      Borrow allowances 
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
    bytes32 actionArgsHash,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    public
    override
  {
    VaultPermissions.permitBorrow(owner, receiver, value, deadline, actionArgsHash, v, r, s);
  }

  /**
   * @dev Computes max borrow amount a user can take given their 'asset'
   * (collateral) balance and price.
   * Requirements:
   * - Must read price from {FujiOracle}.
   *
   * @param borrower to whom to check max borrow amount
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
    uint256 assets = convertToAssets(balanceOf(owner));

    // Handle no debt case.
    if (debtShares == 0) {
      freeAssets = assets;
    } else {
      uint256 debt = convertToDebt(debtShares);
      uint256 price = oracle.getPriceOf(asset(), debtAsset(), decimals());
      uint256 lockedAssets = (debt * 1e18 * price) / (maxLtv * 10 ** _debtDecimals);

      if (lockedAssets == 0) {
        // Handle wei level amounts in where 'lockedAssets' < 1 wei.
        lockedAssets = 1;
      }

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
   * @param debt amount to convert to `debtShares`
   * @param rounding direction of division remainder
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
   * - Must return zero if `debtSharesSupply` == 0.
   *
   * @param shares amount to convert to `debt`
   * @param rounding direction of division remainder
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
   * @param caller or operator
   * @param receiver to whom borrowed amount is transferred
   * @param owner to whom `debtShares` get minted
   * @param assets amount of debt
   * @param shares amount of `debtShares`
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
   * @dev Runs common checks for all "borrow" or "mintDebt" actions in this vault.
   * Requirements:
   * - Must revert for all conditions not passed.
   *
   * @param caller msg.sender in this context
   * @param receiver of the borrow amount
   * @param owner of the debt accountability
   * @param debt or borrowed amount of debt asset
   * @param shares corresponding to debt
   */
  function _borrowChecks(
    address caller,
    address receiver,
    address owner,
    uint256 debt,
    uint256 shares
  )
    private
  {
    if (
      debt == 0 || shares == 0 || receiver == address(0) || owner == address(0) || debt < minAmount
    ) {
      revert BorrowingVault__borrow_invalidInput();
    }
    if (debt > maxBorrow(owner)) {
      revert BorrowingVault__borrow_moreThanAllowed();
    }
    if (caller != owner) {
      _spendBorrowAllowance(owner, caller, receiver, debt);
    }
  }

  /**
   * @dev Perform payback action at provider. Payback/burnDebtShares common workflow.
   * Requirements:
   * - Must call `activeProvider` in `_executeProviderAction()`.
   * - Must emit a Payback event.
   *
   * @param caller msg.sender
   * @param owner to whom `debtShares` will bet burned
   * @param assets amount of debt
   * @param shares amount of `debtShares`
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
    SafeERC20.safeTransferFrom(IERC20(debtAsset()), caller, address(this), assets);

    _executeProviderAction(assets, "payback", activeProvider);

    _burnDebtShares(owner, shares);

    emit Payback(caller, owner, assets, shares);
  }

  /**
   * @dev Runs common checks for all "payback" or "burnDebt" actions in this vault and returns maximum
   * shares to payback if exceeding `owner` debtShares balance.
   * Requirements:
   * - Must revert for all conditions not passed.
   *
   * @param owner of the debt accountability
   * @param debt or borrowed amount of debt asset
   * @param shares of debt being burned
   */
  function _paybackChecks(
    address owner,
    uint256 debt,
    uint256 shares
  )
    private
    view
    returns (uint256)
  {
    if (debt == 0 || shares == 0 || owner == address(0)) {
      revert BorrowingVault__payback_invalidInput();
    }
    if (shares > _debtShares[owner]) {
      shares = _debtShares[owner];
    }
    return shares;
  }

  /**
   * @dev Common workflow to update state and mint `debtShares`.
   *
   * @param owner to whom shares get minted
   * @param amount of shares
   */
  function _mintDebtShares(address owner, uint256 amount) internal {
    debtSharesSupply += amount;
    _debtShares[owner] += amount;
  }

  /**
   * @dev Common workflow to update state and burn `debtShares`.
   *
   * @param owner to whom shares get burned
   * @param amount of shares
   */
  function _burnDebtShares(address owner, uint256 amount) internal {
    uint256 balance = _debtShares[owner];
    if (balance < amount) {
      revert BorrowingVault__burnDebtShares_amountExceedsBalance();
    }
    unchecked {
      _debtShares[owner] = balance - amount;
    }
    debtSharesSupply -= amount;
  }

  /*/////////////////
      Rebalancing 
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
    if (debt > 0) {
      _executeProviderAction(debt, "payback", from);
    }
    if (assets > 0) {
      _executeProviderAction(assets, "withdraw", from);
    }

    _checkRebalanceFee(fee, debt);

    if (assets > 0) {
      _executeProviderAction(assets, "deposit", to);
    }
    if (debt > 0) {
      _executeProviderAction(debt + fee, "borrow", to);
    }
    SafeERC20.safeTransfer(IERC20(debtAsset()), msg.sender, debt + fee);

    if (setToAsActiveProvider) {
      _setActiveProvider(to);
    }

    emit VaultRebalance(assets, debt, address(from), address(to));
    return true;
  }

  /*////////////////////
       Liquidation  
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
    } else if (FULL_LIQUIDATION_THRESHOLD <= healthFactor) {
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

    address caller = msg.sender;

    uint256 liquidationFactor = getLiquidationFactor(owner);
    if (liquidationFactor == 0) {
      revert BorrowingVault__liquidate_positionHealthy();
    }

    // Compute debt amount that must be paid by liquidator.
    uint256 debt = convertToDebt(_debtShares[owner]);
    uint256 debtSharesToCover = Math.mulDiv(_debtShares[owner], liquidationFactor, 1e18);
    uint256 debtToCover = Math.mulDiv(debt, liquidationFactor, 1e18);

    // Compute `gainedShares` amount that the liquidator will receive.
    uint256 price = oracle.getPriceOf(debtAsset(), asset(), _debtDecimals);
    uint256 discountedPrice = Math.mulDiv(price, LIQUIDATION_PENALTY, 1e18);

    uint256 gainedAssets = Math.mulDiv(debtToCover, 10 ** _asset.decimals(), discountedPrice);
    gainedShares = convertToShares(gainedAssets);

    _payback(caller, owner, debtToCover, debtSharesToCover);

    // Ensure liquidator receives no more shares than 'owner' owns.
    uint256 existingShares = maxRedeem(owner);
    if (gainedShares > existingShares) {
      gainedShares = existingShares;
    }

    // Internal share adjusment between 'owner' and 'liquidator'.
    _burn(owner, gainedShares);
    _mint(receiver, gainedShares);

    emit Liquidate(caller, receiver, owner, gainedShares, debtToCover, price, liquidationFactor);
  }

  /*/////////////////////////
      Admin set functions 
  /////////////////////////*/

  /**
   * @notice Sets `newOracle` address as the {FujiOracle} for this vault.
   *
   * @param newOracle address
   *
   * @dev Requirements:
   * - Must not be address zero.
   * - Must emit a OracleChanged event.
   * - Must be called from a timelock.
   */
  function setOracle(IFujiOracle newOracle) external onlyTimelock {
    if (address(newOracle) == address(0)) {
      revert BaseVault__setter_invalidInput();
    }
    oracle = newOracle;
    emit OracleChanged(newOracle);
  }

  /**
   * @notice Sets the maximum loan-to-value factor and the Loan-To-Value liquidation threshold factor of this vault.
   *
   * @param maxLtv_ factor to be set
   * @param liqRatio_ factor to be set
   *
   * @dev See factor
   * https://github.com/Fujicracy/fuji-v2/tree/main/packages/protocol#readme.
   *
   * Restrictions for 'liqRatio':
   * - Must be greater than 'maxLTV'.
   * - Must be at least 2% (2e16).
   * - Must be less than 100% (1e18).
   * Restrictions for 'maxLtv':
   * - Must be at least 1% (1e16).
   * - Must be less than 100% (1e18).
   */
  function setLtvFactors(uint256 maxLtv_, uint256 liqRatio_) external onlyTimelock {
    if (
      liqRatio_ <= maxLtv_ || liqRatio_ <= maxLtv || liqRatio_ < 2e16 || liqRatio_ >= 1e18
        || maxLtv_ < 1e16 || maxLtv_ >= 1e18
    ) {
      revert BaseVault__setter_invalidInput();
    }

    maxLtv = maxLtv_;
    liqRatio = liqRatio_;

    emit MaxLtvChanged(maxLtv);
    emit LiqRatioChanged(liqRatio);
  }

  /// @inheritdoc BaseVault
  function _setProviders(ILendingProvider[] memory providers) internal override {
    uint256 len = providers.length;
    for (uint256 i = 0; i < len;) {
      if (address(providers[i]) == address(0)) {
        revert BaseVault__setter_invalidInput();
      }
      SafeERC20.forceApprove(
        IERC20(asset()),
        providers[i].approvedOperator(asset(), asset(), debtAsset()),
        type(uint256).max
      );
      SafeERC20.forceApprove(
        IERC20(debtAsset()),
        providers[i].approvedOperator(debtAsset(), asset(), debtAsset()),
        type(uint256).max
      );
      unchecked {
        ++i;
      }
    }
    _providers = providers;

    emit ProvidersChanged(providers);
  }

  /**
   * @notice In case someone repays this vault's debt directly to the lending provider,
   * a borrow is done with the amount that was repaid so no issues regarding
   * the relationship between debt and debt shares occurs.
   *
   * @param  treasury address to receive the borrowed amount
   */
  function correctDebt(address treasury) external onlyTimelock {
    uint256 vaultDebt = totalDebt();
    uint256 vaultDebtShares = debtSharesSupply;

    // Check if there is need for correction.
    if (vaultDebt >= vaultDebtShares || vaultDebt != 0 || vaultDebtShares == 0) {
      revert BorrowingVault__correctDebt_noNeedForCorrection();
    }

    _executeProviderAction(vaultDebtShares, "borrow", activeProvider);
    SafeERC20.safeTransfer(IERC20(debtAsset()), treasury, vaultDebtShares);
  }
}
