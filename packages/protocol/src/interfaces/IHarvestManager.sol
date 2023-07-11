// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title IHarvestManager
 *
 * @author Fujidao Labs
 *
 * @notice Defines the interface of {HarvestManager}.
 */

import {IVault} from "./IVault.sol";
import {IHarvestable} from "./IHarvestable.sol";
import {ISwapper} from "./ISwapper.sol";

enum Strategy {
  ConvertToCollateral,
  RepayDebt,
  Distribute
}

interface IHarvestManager {
  /**
   * @dev Emit when `executor`'s `allowed` state changes.
   *
   * @param executor whose permission is changing
   * @param allowed boolean for new state
   */
  event AllowExecutor(address indexed executor, bool allowed);

  /**
   * @notice Set `executor` as an authorized address for calling harvest operations
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
   * @notice Collects rewards from the protocol.
   *
   * @param vault to harvest rewards.
   * @param strategy enum of the strategy to apply after harvesting rewards.
   * @param provider lending provider to be harvested.
   * @param swapper ISwapper to be used to swap rewards.
   * @param data bytes to be used to call the harvest function at the lending provider.
   *
   */
  function harvest(
    IVault vault,
    Strategy strategy,
    IHarvestable provider,
    ISwapper swapper,
    bytes memory data
  )
    external;
}