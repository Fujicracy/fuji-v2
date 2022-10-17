// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {AccessControl} from "openzeppelin-contracts/contracts/access/AccessControl.sol";
import {IVaultFactory} from "./interfaces/IVaultFactory.sol";
import {TimeLock} from "./helpers/TimeLock.sol";

/// @dev Custom Errors
error ZeroAddress();
error NotAllowed();

/// @notice Vault deployer contract with template factory allow.
/// ref: https://github.com/sushiswap/trident/blob/master/contracts/deployer/MasterDeployer.sol
contract Chief is AccessControl {
  event DeployVault(address indexed factory, address indexed vault, bytes deployData);
  event AddToAllowed(address indexed factory);
  event RemoveFromAllowed(address indexed factory);

  address public timelock;

  mapping(address => bool) public vaults;
  mapping(address => bool) public allowedFactories;

  bytes32 public constant TIMELOCK_ADMIN_ROLE = keccak256("TIMELOCK_ADMIN_ROLE");
  bytes32 public constant TIMELOCK_PROPOSER_ROLE = keccak256("TIMELOCK_PROPOSER_ROLE");
  bytes32 public constant TIMELOCK_EXECUTOR_ROLE = keccak256("TIMELOCK_EXECUTOR_ROLE");
  bytes32 public constant TIMELOCK_CANCELLER_ROLE = keccak256("TIMELOCK_CANCELLER_ROLE");

  bytes32 public constant REBALANCER_ROLE = keccak256("REBALANCER_ROLE");
  bytes32 public constant HARVESTER_ROLE = keccak256("HARVESTER_ROLE");
  bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");

  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  bytes32 public constant UNPAUSER_ROLE = keccak256("UNPAUSER_ROLE");

  constructor() {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(TIMELOCK_ADMIN_ROLE, msg.sender);
    _deployTimelock();
    _setRoleAdmin(TIMELOCK_PROPOSER_ROLE, TIMELOCK_ADMIN_ROLE);
    _setRoleAdmin(TIMELOCK_EXECUTOR_ROLE, TIMELOCK_ADMIN_ROLE);
    _setRoleAdmin(TIMELOCK_CANCELLER_ROLE, TIMELOCK_ADMIN_ROLE);
  }

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

  function addToAllowed(address _factory) external onlyRole(DEFAULT_ADMIN_ROLE) {
    allowedFactories[_factory] = true;
    emit AddToAllowed(_factory);
  }

  function removeFromAllowed(address _factory) external onlyRole(DEFAULT_ADMIN_ROLE) {
    allowedFactories[_factory] = false;
    emit RemoveFromAllowed(_factory);
  }

  // function createRole(string memory roleName) external onlyRole(DEFAULT_ADMIN_ROLE) {
  //   bytes32 roleHash = keccak256(roleName);
  //   roles[roleNeme] = roleHash;
  //   _grantRole(roleHash, msg.sender);
  // }
  function _deployTimelock() internal {
    timelock = address(new TimeLock{salt: "0x00"}(address(this), 2 days));
    _grantRole(TIMELOCK_ADMIN_ROLE, timelock);
  }
}
