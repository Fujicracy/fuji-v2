// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {IVaultFactory} from "./interfaces/IVaultFactory.sol";

/// @dev Custom Errors
error ZeroAddress();
error NotAllowed();

/// @notice Vault deployer contract with template factory allow.
/// ref: https://github.com/sushiswap/trident/blob/master/contracts/deployer/MasterDeployer.sol
contract Chief is Ownable {
  event DeployVault(address indexed factory, address indexed vault, bytes deployData);
  event AddToAllowed(address indexed factory);
  event RemoveFromAllowed(address indexed factory);

  mapping(address => bool) public vaults;
  mapping(address => bool) public allowedFactories;

  function deployVault(address _factory, bytes calldata _deployData)
    external
    returns (address vault)
  {
    if (!allowedFactories[_factory]) {
      revert NotAllowed();
    }
    vault = IVaultFactory(_factory).deployVault(_deployData);
    vaults[vault] = true;
    emit DeployVault(_factory, vault, _deployData);
  }

  function addToAllowed(address _factory) external onlyOwner {
    allowedFactories[_factory] = true;
    emit AddToAllowed(_factory);
  }

  function removeFromAllowed(address _factory) external onlyOwner {
    allowedFactories[_factory] = false;
    emit RemoveFromAllowed(_factory);
  }
}
