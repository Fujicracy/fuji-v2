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
   * @dev Emit when `fee` changes.
   *
   * @param fee new fee (in 1e18)
   */
  event SetFee(uint256 fee);

  /**
   * @dev Emit when a harvest is complete at the IHarvestManager level.
   *
   * @param vault that harvested rewards.
   * @param strategy enum of the strategy applied.
   * @param treasury address that received the protocol fee.
   * @param protocolFee amount of protocol fee received.
   *
   */
  event Harvest(address vault, Strategy strategy, address treasury, uint256 protocolFee);

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
   * @notice Set the protocol fee.
   *
   * @param fee to change to.
   *
   * @dev Requirement:
   * - Must be called from a timelock.
   * - `fee` must be less than or equal to MAX_FEE.
   * - `fee` must be greater than or equal to MIN_FEE.
   * - Must be in 1e18 (1e18 = 100%)
   */
  function setFee(uint256 fee) external;

  /**
   * @notice Returns the protocol fee.
   */
  function protocolFee() external view returns (uint256);

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

  /**
   * @notice Implementes the strategy after harvesting rewards.
   *
   * @param vault that harvested rewards.
   * @param strategy enum of the strategy to apply.
   * @param provider lending that harvested.
   * @param swapper ISwapper to be used to swap rewards.
   * @param data bytes to be used by vault after implementing the strategy.
   *
   */
  function completeHarvest(
    address vault,
    Strategy strategy,
    IHarvestable provider,
    ISwapper swapper,
    address[] memory tokens,
    uint256[] memory amounts
  )
    external
    returns (bytes memory data);
}
