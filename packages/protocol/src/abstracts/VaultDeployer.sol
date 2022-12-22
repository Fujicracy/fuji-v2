// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {IChief} from "../interfaces/IChief.sol";

/// @notice Vault deployer for whitelisted template factories.
abstract contract VaultDeployer {
  error VaultDeployer__onlyChief_notAuthorized();
  error VaultDeployer__onlyTimelock_notAuthorized();
  error VaultDeployer__zeroAddress();

  /**
   * @dev Emit when a vault is registered
   * @param vault address
   * @param asset address
   * @param salt used for address generation
   */
  event VaultRegistered(address vault, address asset, bytes32 salt);

  address public immutable chief;

  address[] public allVaults;
  mapping(address => address[]) public vaultsByAsset;
  mapping(bytes32 => address) public configAddress;

  modifier onlyChief() {
    if (msg.sender != chief) {
      revert VaultDeployer__onlyChief_notAuthorized();
    }
    _;
  }

  modifier onlyTimelock() {
    if (msg.sender != IChief(chief).timelock()) {
      revert VaultDeployer__onlyTimelock_notAuthorized();
    }
    _;
  }

  constructor(address _chief) {
    if (_chief == address(0)) {
      revert VaultDeployer__zeroAddress();
    }
    chief = _chief;
  }

  function _registerVault(address vault, address asset, bytes32 salt) internal onlyChief {
    // Store the address of the deployed contract.
    configAddress[salt] = vault;
    vaultsByAsset[asset].push(vault);
    allVaults.push(vault);
    emit VaultRegistered(vault, asset, salt);
  }

  function vaultsCount(address asset) external view returns (uint256 count) {
    count = vaultsByAsset[asset].length;
  }

  function getVaults(
    address asset,
    uint256 startIndex,
    uint256 count
  )
    external
    view
    returns (address[] memory vaults)
  {
    vaults = new address[](count);
    for (uint256 i = 0; i < count; i++) {
      vaults[i] = vaultsByAsset[asset][startIndex + i];
    }
  }
}
