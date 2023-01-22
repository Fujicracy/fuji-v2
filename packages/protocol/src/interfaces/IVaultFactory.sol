// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title IVaultFactor
 * @author Fujidao Labs
 *
 * @notice Vault deployment interface.
 */

interface IVaultFactory {
  /**
   * @notice Deploys a new type of vault.
   * Requirements:
   * - Must be called from {Chief} contract only.
   *
   * @param deployData The encoded data containing constructor arguments.
   */
  function deployVault(bytes calldata deployData) external returns (address vault);

  /**
   * @notice Returns the address for a specific salt.
   *
   * @param data bytes32 used as salt in vault deployment.
   */
  function configAddress(bytes32 data) external returns (address vault);
}
