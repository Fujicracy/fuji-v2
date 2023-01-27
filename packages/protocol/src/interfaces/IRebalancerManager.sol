// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title IRebalancerManager
 *
 * @author Fujidao Labs
 *
 * @notice Defines the interface of {RebalancerManager}.
 */

import {IVault} from "./IVault.sol";
import {ILendingProvider} from "./ILendingProvider.sol";
import {IFlasher} from "./IFlasher.sol";

interface IRebalancerManager {
  /**
   * @dev Emit when `executor`'s `allowed` state changes.
   *
   * @param executor whose permission is changing
   * @param allowed boolean for new state
   */
  event AllowExecutor(address indexed executor, bool allowed);

  /**
   * @notice Rebalance funds of a vault between providers.
   *
   * @param vault that will be rebalanced
   * @param assets amount to be rebalanced
   * @param debt amount to be rebalanced (zero if `vault` is a {YieldVault})
   * @param from provider address
   * @param to provider address
   * @param flasher contract address (zero address if `vault` is a {YieldVault})
   * @param setToAsActiveProvider boolean if `activeProvider` should change
   *
   * @dev Requirements:
   * - Must only be called by a valid executor.
   * - Must check `assets` and `debt` amounts are less than `vault`'s managed amounts.
   */
  function rebalanceVault(
    IVault vault,
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    IFlasher flasher,
    bool setToAsActiveProvider
  )
    external
    returns (bool success);

  /**
   * @notice Set `executor` as an authorized address for calling rebalancer operations
   * or remove authorization.
   *
   * @param executor address
   * @param allowed boolean
   *
   * @dev Requirement:
   * - Must be called from a timelock.
   * - Must emit a `AllowExecutor` event.
   */
  function allowExecutor(address executor, bool allowed) external;

  /**
   * @notice Callback function that completes execution logic of a rebalance
   * operation with a flashloan.
   *
   * @param vault being rebalanced
   * @param assets amount to rebalance
   * @param debt amount to rebalance
   * @param from provider address
   * @param to provider address
   * @param flasher contract address
   * @param setToAsActiveProvider boolean to define `to` as active provider
   *
   * @dev Requirements:
   * - Must check this address was the flashloan originator.
   * - Must clear the check state variable `_entryPoint`.
   */
  function completeRebalance(
    IVault vault,
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    IFlasher flasher,
    bool setToAsActiveProvider
  )
    external
    returns (bool success);
}
