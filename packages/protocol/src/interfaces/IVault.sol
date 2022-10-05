// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Vault Interface.
 * @author Fujidao Labs
 * @notice Defines the interface for vault operations extending from IERC4326.
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
   * @dev Emitted when borrow action occurs.
   * @param sender address who calls {IVault-payback}
   * @param owner address whose debt will be reduced
   * @param debt amount
   * @param shares amound of 'debtShares' burned
   */
  event Payback(address indexed sender, address indexed owner, uint256 debt, uint256 shares);

  /**
   * @dev Emitted when the oracle address is changed
   * @param newOracle The new oracle address
   */
  event OracleChanged(IFujiOracle newOracle);

  /**
   * @dev Emitted when the available providers for the vault change
   * @param newProviders the new providers available
   */
  event ProvidersChanged(ILendingProvider[] newProviders);

  /**
   * @dev Emitted when the active provider is changed
   * @param newActiveProvider the new active provider
   */
  event ActiveProviderChanged(ILendingProvider newActiveProvider);

  /**
   * @dev Emitted when the max LTV is changed
   * See factors: https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme
   * @param newMaxLtv the new max LTV
   */
  event MaxLtvChanged(uint256 newMaxLtv);

  /**
   * @dev Emitted when the liquidation ratio is changed
   * See factors: https://github.com/Fujicracy/CrossFuji/tree/main/packages/protocol#readme
   * @param newLiqRatio the new liquidation ratio
   */
  event LiqRatioChanged(uint256 newLiqRatio);

  /**
   * @dev Emitted when the minumum deposit amount is changed
   * @param newMinDeposit the new minimum deposit amount
   */
  event MinDepositAmountChanged(uint256 newMinDeposit);

  /**
   * @dev Emitted when the deposit cap is changed
   * @param newDepositCap the new deposit cap of this vault.
   */
  event DepositCapChanged(uint256 newDepositCap);

  /// Debt management functions

  /**
   * @dev Returns the decimals for 'debtAsset' of this vault.
   *
   * - MUST match the 'debtAsset' decimals in ERC-20 token contract.
   */
  function debtDecimals() external view returns (uint8);

  /**
   * @dev Based on {IERC4626-asset}.
   * @dev Returns the address of the underlying token used for the Vault for debt, borrowing, and repaying.
   *
   * - MUST be an ERC-20 token contract.
   * - MUST NOT revert.
   */
  function debtAsset() external view returns (address);

  /**
   * @dev Returns the amount of debt owned by `account`.
   */
  function balanceOfDebt(address account) external view returns (uint256 debt);

  /**
   * @dev Based on {IERC4626-totalAssets}.
   * @dev Returns the total amount of the underlying debt asset that is “managed” by Vault.
   *
   * - SHOULD include any compounding that occurs from yield.
   * - MUST be inclusive of any fees that are charged against assets in the Vault.
   * - MUST NOT revert.
   */
  function totalDebt() external view returns (uint256);

  /**
   * @dev Based on {IERC4626-convertToShares}.
   * @dev Returns the amount of shares that the Vault would exchange for the amount of debt assets provided, in an ideal
   * scenario where all the conditions are met.
   *
   * - MUST NOT be inclusive of any fees that are charged against assets in the Vault.
   * - MUST NOT show any variations depending on the caller.
   * - MUST NOT reflect slippage or other on-chain conditions, when performing the actual exchange.
   * - MUST NOT revert.
   *
   * NOTE: This calculation MAY NOT reflect the “per-user” price-per-share, and instead should reflect the
   * “average-user’s” price-per-share, meaning what the average user should expect to see when exchanging to and
   * from.
   */
  function convertDebtToShares(uint256 debt) external view returns (uint256 shares);

  /**
   * @dev Based on {IERC4626-convertToAssets}.
   * @dev Returns the amount of debt assets that the Vault would exchange for the amount of shares provided, in an ideal
   * scenario where all the conditions are met.
   *
   * - MUST NOT be inclusive of any fees that are charged against assets in the Vault.
   * - MUST NOT show any variations depending on the caller.
   * - MUST NOT reflect slippage or other on-chain conditions, when performing the actual exchange.
   * - MUST NOT revert.
   *
   * NOTE: This calculation MAY NOT reflect the “per-user” price-per-share, and instead should reflect the
   * “average-user’s” price-per-share, meaning what the average user should expect to see when exchanging to and
   * from.
   */
  function convertToDebt(uint256 shares) external view returns (uint256 debt);

  /**
   * @dev Based on {IERC4626-maxDeposit}.
   * @dev Returns the maximum amount of the debt asset that can be borrowed for the receiver,
   * through a borrow call.
   *
   * - MUST return a limited value if receiver is subject to some borrow limit.
   * - MUST return 2 ** 256 - 1 if there is no limit on the maximum amount of assets that may be borrowed.
   * - MUST NOT revert.
   */
  function maxBorrow(address borrower) external view returns (uint256);

  /**
   * @dev Based on {IERC4626-deposit}.
   * @dev Mints debtShares to owner by taking a loan of exact amount of underlying tokens.
   *
   * - MUST emit the Borrow event.
   * - MUST revert if owner does not own sufficient collateral to back debt.
   * - MUST revert if caller is not owner or permission to act owner.
   */
  function borrow(uint256 debt, address receiver, address owner) external returns (uint256);

  /**
   * @dev burns debtShares to owner by paying back loan with exact amount of underlying tokens.
   *
   * - MUST emit the Payback event.
   *
   * NOTE: most implementations will require pre-erc20-approval of the underlying asset token.
   */
  function payback(uint256 debt, address receiver) external returns (uint256);

  /// General functions

  /**
   * @notice Returns the active provider of this vault.
   */
  function activeProvider() external returns (ILendingProvider);

  ///  Liquidation Functions

  /**
   * @notice Returns the current health factor of 'account'.
   * @param account address to get health factor
   * @dev 'healthFactor' is scaled up by 100.
   * A value below 100 means 'account' is eligable for liquidation.
   *
   * - MUST return type(uint254).max when 'account' has no debt.
   * - MUST revert in {YieldVault}.
   */
  function getHealthFactor(address account) external returns (uint256 healthFactor);

  /**
   * @notice Returns the liquidation close factor based on 'account's' health factor.
   * @param account address owner of debt position.
   *
   * - MUST return zero if `account` is not liquidatable.
   * - MUST revert in {YieldVault}.
   */
  function getLiquidationFactor(address account) external returns (uint256 liquidationFactor);

  /**
   * @notice Performs liquidation of an unhealthy position, meaning a 'healthFactor' below 100.
   * @param account address to be liquidated.
   * @dev WARNING! It is liquidator's responsability to check if liquidation is profitable.
   *
   * - MUST revert if caller is not an approved liquidator.
   * - MUST revert if 'account' is not liquidatable.
   * - MUST emit the Liquidation event.
   * - MUST liquidate 50% of 'account' debt when: 100 >= 'healthFactor' > 95.
   * - MUST liquidate 100% of 'account' debt when: 95 > 'healthFactor'.
   * - MUST revert in {YieldVault}.
   *
   */
  function liquidate(address account) external returns (uint256 gainedShares);

  ////////////////////////
  /// Setter functions ///
  ///////////////////////

  /**
   * @notice Sets the lists of providers of this vault.
   *
   * - MUST NOT contain zero addresses.
   */
  function setProviders(ILendingProvider[] memory providers) external;

  /**
   * @notice Sets the active provider for this vault.
   *
   * - MUST be a provider previously set by `setProviders()`.
   */
  function setActiveProvider(ILendingProvider activeProvider) external;

  /**
   * @dev Sets the minimum deposit amount.
   */
  function setMinDepositAmount(uint256 amount) external;

  /**
   * @dev Sets the deposit cap amount of this vault.
   *
   * - MUST be greater than zero.
   */
  function setDepositCap(uint256 newCap) external;
}
