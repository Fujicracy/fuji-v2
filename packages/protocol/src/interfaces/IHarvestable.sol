// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IVault} from "./IVault.sol";
import {Strategy} from "./IHarvestManager.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

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
   * @param data bytes to be used to call the harvest function at the lending provider.
   *
   * @return tokens and respective amounts of rewards collected.
   *
   * @dev Requirement:
   * - Must return empty `tokens` and `amounts` if rewards can be claimed directly to a recipient.
   * - Must encode recipient address for rewards in `data` if provider allows this logic.
   *
   */
  function harvest(bytes memory data)
    external
    returns (address[] memory tokens, uint256[] memory amounts);

  /**
   * @notice Returns the tokens and respective amounts of rewards expected to be harvested from the protocol.
   *
   * @param vault IVault required by some specific providers with multi-markets.
   *
   */
  function previewHarvest(IVault vault)
    external
    view
    returns (address[] memory tokens, uint256[] memory amounts);
}
