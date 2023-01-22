// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title VaultDeployer
 * @author Fujidao Labs
 *
 * @notice Abstract contract to be inherited by vault deployers
 * for whitelisted template factories.
 * This contract provides methods that facilitate information for
 * front-end applications.
 */

import {IChief} from "../interfaces/IChief.sol";

abstract contract VaultDeployer {
  /// @dev Custom Errors
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

  /**
   * @notice Abstract constructor of a new {VaultDeployer}.
   * Requirements:
   * - Must pass non-zero {Chief} address.
   *
   * @param chief_ address.
   */
  constructor(address chief_) {
    if (chief_ == address(0)) {
      revert VaultDeployer__zeroAddress();
    }
    chief = chief_;
  }

  /**
   * @notice Returns the historic number of vaults of an `asset` type
   * deployed by this deployer.
   *
   * @param asset address.
   */
  function vaultsCount(address asset) external view returns (uint256 count) {
    count = vaultsByAsset[asset].length;
  }

  /**
   * @notice Returns an array of vaults based on their `asset` type.
   *
   * @param asset address.
   * @param startIndex number to start loop in vaults[] array.
   * @param count number to end loop in vaults[] array.
   */
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

  /**
   * @dev Registers a record of `vault` based on vault's `asset`.
   *
   * @param vault address
   * @param asset address of the vault
   */
  function _registerVault(address vault, address asset, bytes32 salt) internal onlyChief {
    // Store the address of the deployed contract.
    configAddress[salt] = vault;
    vaultsByAsset[asset].push(vault);
    allVaults.push(vault);
    emit VaultRegistered(vault, asset, salt);
  }
}
