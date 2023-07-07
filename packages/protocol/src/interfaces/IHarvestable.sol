// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IVault} from "./IVault.sol";

/**
 * @title IHarvestable
 *
 * @author Fujidao Labs
 *
 * @notice  Defines the interface to perform harvest operations at lending providers.
 *
 * @dev Functions are intended to be called in the context of a Vault via delegateCall,
 * except indicated.
 */

interface IHarvestable {
  /**
   * @notice Collects rewards from the protocol. Returns false if there are no rewards to be collected.
   *
   * @param strategy to later be executed in the vault. Useful for the case we can execute the harvest in different tokens.
   * @param data bytes to be used to call the harvest function at the lending provider.
   *
   */
  function harvest(IVault.Strategy strategy, bytes memory data) external returns (bool success);

  /**
   * @notice Returns the tokens and respective amounts of rewards expected to be harvested from the protocol.
   *
   * @param vault IVault required by some specific providers with multi-markets.
   * @param strategy to later be executed in the vault. Useful for the case we can execute the harvest in different tokens.
   *
   */
  function previewHarvest(
    IVault vault,
    IVault.Strategy strategy
  )
    external
    view
    returns (address[] memory tokens, uint256[] memory amounts);
}
