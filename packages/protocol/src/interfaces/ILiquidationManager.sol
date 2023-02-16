// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title ILiquidationManager
 *
 * @author Fujidao Labs
 *
 * @notice Defines the interface of {LiquidationManager}.
 */

import {IVault} from "./IVault.sol";
import {IFlasher} from "./IFlasher.sol";

interface ILiquidationManager {
  /**
   * @dev Emit when `executor`'s `allowed` state changes.
   *
   * @param executor whose permission is changing
   * @param allowed boolean for new state
   */
  event AllowExecutor(address indexed executor, bool allowed);

  /**
   * @notice Set `executor` as an authorized address for calling liquidation operations
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
   * @notice Liquidates the position of a given user.
   *
   * @param users to be liquidated
   * @param vault who holds the `users` positions
   * @param flasher to be used in liquidation
   *
   * @dev Requirement:
   * - Must be called from a keeper.
   * - Must emit a `AllowExecutor` event.
   * - Must not revert if at least one user is liquidated.
   */
  function liquidate(address[] memory users, IVault vault, IFlasher flasher) external;
}
