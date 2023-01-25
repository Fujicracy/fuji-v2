// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title IVault
 * @author Fujidao Labs
 *
 * @notice Interface for vaults extending from IERC4326.
 */

import {IERC4626} from "openzeppelin-contracts/contracts/interfaces/IERC4626.sol";
import {ILendingProvider} from "./ILendingProvider.sol";
import {IFujiOracle} from "./IFujiOracle.sol";

interface IVault is IERC4626 {
  /// Events
  /**
   * @dev Emitted when borrow action occurs.
   * @param sender address who calls {IVault-borrow}
   * @param receiver address of the borrowed 'debt' amount
   * @param owner address who will incur the debt
   * @param debt amount
   * @param shares amound of 'debtShares' received
   */
  event Borrow(
    address indexed sender,
    address indexed receiver,
    address indexed owner,
    uint256 debt,
    uint256 shares
  );

  /**
   * @dev Emitted when payback action occurs.
   * @param sender address who calls {IVault-payback}
   * @param owner address whose debt will be reduced
   * @param debt amount
   * @param shares amound of 'debtShares' burned
   */
  event Payback(address indexed sender, address indexed owner, uint256 debt, uint256 shares);

  /**
   * @dev Emitted when the oracle address is changed.
   * @param newOracle The new oracle address
   */
  event OracleChanged(IFujiOracle newOracle);

  /**
   * @dev Emitted when the available providers for the vault change.
   * @param newProviders the new providers available
   */
  event ProvidersChanged(ILendingProvider[] newProviders);

  /**
   * @dev Emitted when the active provider is changed.
   * @param newActiveProvider the new active provider
   */
  event ActiveProviderChanged(ILendingProvider newActiveProvider);

  /**
   * @dev Emitted when the vault is rebalanced.
   * @param assets amount to be rebalanced
   * @param debt amount to be rebalanced
   * @param from provider
   * @param to provider
   */
  event VaultRebalance(uint256 assets, uint256 debt, address indexed from, address indexed to);

  /**
   * @dev Emitted when the max LTV is changed.
   * See factors: https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme.
   * @param newMaxLtv the new max LTV
   */
  event MaxLtvChanged(uint256 newMaxLtv);

  /**
   * @dev Emitted when the liquidation ratio is changed.
   * See factors: https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme.
   * @param newLiqRatio the new liquidation ratio
   */
  event LiqRatioChanged(uint256 newLiqRatio);

  /**
   * @dev Emitted when the minumum amount is changed.
   * @param newMinAmount the new minimum amount
   */
  event MinAmountChanged(uint256 newMinAmount);

  /**
   * @dev Emitted when the deposit cap is changed.
   * @param newDepositCap the new deposit cap of this vault
   */
  event DepositCapChanged(uint256 newDepositCap);

  /// Debt management functions

  /**
   * @notice Returns the decimals for 'debtAsset' of this vault.
   * Requirements:
   * - Must match the 'debtAsset' decimals in ERC-20 token contract.
   * - Must return zero in a {YieldVault}.
   */
  function debtDecimals() external view returns (uint8);

  /**
   * @notice Returns the address of the underlying token used for the
   * Vault for debt, borrowing, and repaying. Based on {IERC4626-asset}.
   * Requirements:
   * - Must be an ERC-20 token contract.
   * - Must not revert.
   * - Must return zero in a {YieldVault}.
   */
  function debtAsset() external view returns (address);

  /**
   * @dev Returns the amount of debt owned by `owner`.
   *
   * @param owner address to check balance
   */
  function balanceOfDebt(address owner) external view returns (uint256 debt);

  /**
   * @notice Returns the total amount of the underlying debt asset
   * that is “managed” by this vault. Based on {IERC4626-totalAssets}..
   * Requirements:
   * - Must account for any compounding occuring from yield or interest accrual.
   * - Must be inclusive of any fees that are charged against assets in the Vault.
   * - Must not revert.
   * - Must return zero in a {YieldVault}.
   */
  function totalDebt() external view returns (uint256);

  /**
   * @notice Returns the amount of shares this vault would exchange for the amount
   * of debt assets provided. Based on {IERC4626-convertToShares}.
   * Requirements:
   * - Must not be inclusive of any fees that are charged against assets in the Vault.
   * - Must not show any variations depending on the caller.
   * - Must not reflect slippage or other on-chain conditions, when performing the actual exchange.
   * - Must not revert.
   *
   * NOTE: This calculation MAY not reflect the “per-user” price-per-share, and instead Must reflect the
   * “average-user’s” price-per-share, meaning what the average user Must expect to see when exchanging to and
   * from.
   *
   * @param debt amount to convert into `debtShares`
   */
  function convertDebtToShares(uint256 debt) external view returns (uint256 shares);

  /**
   * @notice Returns the amount of debt assets that this vault would exchange for the amount
   * of shares provided. Based on {IERC4626-convertToAssets}.
   * Requirements:
   * - Must not be inclusive of any fees that are charged against assets in the Vault.
   * - Must not show any variations depending on the caller.
   * - Must not reflect slippage or other on-chain conditions, when performing the actual exchange.
   * - Must not revert.
   *
   * NOTE: This calculation MAY not reflect the “per-user” price-per-share, and instead Must reflect the
   * “average-user’s” price-per-share, meaning what the average user Must expect to see when exchanging to and
   * from.
   *
   * @param shares amount to convert into `debt`
   */
  function convertToDebt(uint256 shares) external view returns (uint256 debt);

  /**
   * @notice Returns the maximum amount of the debt asset that can be borrowed for the receiver,
   * through a borrow call. Based on {IERC4626-maxDeposit}.
   * Requirements:
   * - Must return a limited value if receiver is subject to some borrow limit.
   * - Must return 2 ** 256 - 1 if there is no limit on the maximum amount of assets that may be borrowed.
   * - Must not revert.
   *
   * @param borrower address to whom to check
   */
  function maxBorrow(address borrower) external view returns (uint256);

  /**
   * @notice Perform a borrow action. Function inspired on {IERC4626-deposit}.
   * Requirements:
   * - Must emit the Borrow event.
   * - Must revert if owner does not own sufficient collateral to back debt.
   * - Must revert if caller is not owner or permissioned operator to act on owner behalf.
   *
   * @param debt amount
   * @param receiver address of the `debt` amount
   * @param owner address who will incur the `debt` amount
   *
   * * @dev Mints debtShares to owner by taking a loan of exact amount of underlying tokens.
   */
  function borrow(uint256 debt, address receiver, address owner) external returns (uint256);

  /**
   * @notice Burns debtShares to `receiver` by paying back loan with exact amount of underlying tokens.
   * Requirements:
   * - Must emit a Payback event.
   *
   * @param debt amount to payback
   * @param receiver address to whom debt amount is being paid back
   *
   * @dev Implementations will require pre-erc20-approval of the underlying asset token.
   */
  function payback(uint256 debt, address receiver) external returns (uint256);

  /// General functions

  /**
   * @notice Returns the active provider of this vault.
   */
  function getProviders() external view returns (ILendingProvider[] memory);
  /**
   * @notice Returns the active provider of this vault.
   */
  function activeProvider() external view returns (ILendingProvider);

  /// Rebalancing Function

  /**
   * @notice Performs rebalancing of vault by moving funds across providers.
   * Requirements:
   * - Must check providers `from` and `to` are valid.
   * - Must be called from a {RebalancerManager} contract that makes all proper checks.
   * - Must revert if caller is not an approved rebalancer.
   * - Must emit the VaultRebalance event.
   * - Must check `fee` is a reasonable amount.
   *
   * @param assets amount of this vault to be rebalanced
   * @param debt amount of this vault to be rebalanced (Note: pass zero if this is a {YieldVault})
   * @param from provider address currently custoding `assets` and/or `debt`
   * @param to provider address to which `assets` and/or `debt` will be transferred
   * @param fee expected from rebalancing operation
   * @param setToAsActiveProvider boolean
   */
  function rebalance(
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    uint256 fee,
    bool setToAsActiveProvider
  )
    external
    returns (bool);

  ///  Liquidation Function

  /**
   * @notice Returns the current health factor of 'owner'.
   * Requirements:
   * - Must return type(uint254).max when 'owner' has no debt.
   * - Must revert in {YieldVault}.
   *
   * @param owner address to get health factor
   *
   * @dev 'healthFactor' is scaled up by 1e18. A value below 1e18 means 'owner' is eligable
   * for liquidation.
   * See factors: https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme.
   *
   */
  function getHealthFactor(address owner) external returns (uint256 healthFactor);

  /**
   * @notice Returns the liquidation close factor based on 'owner's' health factor.
   * Requirements:
   * - Must return zero if `owner` is not liquidatable.
   * - Must revert in {YieldVault}.
   *
   * @param owner address owner of debt position
   */
  function getLiquidationFactor(address owner) external returns (uint256 liquidationFactor);

  /**
   * @notice Performs liquidation of an unhealthy position, meaning a 'healthFactor' below 100.
   * Requirements:
   * - Must revert if caller is not an approved liquidator.
   * - Must revert if 'owner' is not liquidatable.
   * - Must emit the Liquidation event.
   * - Must liquidate 50% of 'owner' debt when: 100 >= 'healthFactor' > 95.
   * - Must liquidate 100% of 'owner' debt when: 95 > 'healthFactor'.
   * - Must revert in {YieldVault}.
   *
   * @param owner address to be liquidated
   * @param receiver address of the collateral shares of liquidation
   *
   * @dev WARNING! It is liquidator's responsability to check if liquidation is profitable.
   */
  function liquidate(address owner, address receiver) external returns (uint256 gainedShares);

  ////////////////////////
  /// Setter functions ///
  ///////////////////////

  /**
   * @notice Sets the lists of providers of this vault.
   * Requirements:
   * - Must not contain zero addresses.
   *
   * @param providers address array
   */
  function setProviders(ILendingProvider[] memory providers) external;

  /**
   * @notice Sets the active provider for this vault.
   * Requirements:
   * - Must be a provider previously set by `setProviders()`.
   * - Must be called from a timelock contract.
   *
   * @param activeProvider address
   *
   * @dev WARNING! Changing active provider without a `rebalance()` call
   * can result in denial of service for vault users.
   */
  function setActiveProvider(ILendingProvider activeProvider) external;

  /**
   * @notice Sets the minimum amount for: `deposit()`, `mint()` and borrow()`.
   *
   * @param amount to be as minimum.
   */
  function setMinAmount(uint256 amount) external;

  /**
   * @notice Sets the deposit cap amount of this vault.
   * Requirements:
   * - Must be greater than zero.
   *
   * @param newCap amount to be set
   */
  function setDepositCap(uint256 newCap) external;
}
