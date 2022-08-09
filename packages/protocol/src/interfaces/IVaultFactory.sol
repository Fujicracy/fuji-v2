// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.8.9;

/// @notice Vault deployment interface.
interface IVaultFactory {
  function deployVault(bytes calldata _deployData) external returns (address vault);

  function configAddress(bytes32 data) external returns (address vault);
}
