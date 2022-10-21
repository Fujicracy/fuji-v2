// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {AccessControl} from "openzeppelin-contracts/contracts/access/AccessControl.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";
import {IPausableVault} from "./interfaces/IPausableVault.sol";
import {IVaultFactory} from "./interfaces/IVaultFactory.sol";
import {AddrMapper} from "./helpers/AddrMapper.sol";
import {CoreRoles} from "./access/CoreRoles.sol";

import "forge-std/console.sol";

/// @dev Custom Errors
error Chief__ZeroAddress();
error Chief__FactoryNotAllowed();
error Chief__missingRole(address account, bytes32 role);

/// @notice Vault deployer contract with template factory allow.
/// ref: https://github.com/sushiswap/trident/blob/master/contracts/deployer/MasterDeployer.sol
contract Chief is CoreRoles, AccessControl {
  using Address for address;

  event OpenVaultFactory(bool state);
  event DeployVault(address indexed factory, address indexed vault, bytes deployData);
  event AddToAllowed(address indexed factory);
  event RemoveFromAllowed(address indexed factory);
  event TimelockUpdated(address indexed timelock);

  address public timelock;
  address public addrMapper;
  bool public openVaultFactory;

  address[] internal _vaults;
  mapping(address => string) public vaultSafetyRating;
  mapping(address => bool) public allowedFactories;

  constructor() {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(PAUSER_ROLE, address(this));
    _grantRole(UNPAUSER_ROLE, address(this));
    _deployAddrMapper();
  }

  function getVaults() external view returns (address[] memory) {
    return _vaults;
  }

  function setTimelock(address newTimelock) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if (newTimelock == address(0)) {
      revert Chief__ZeroAddress();
    }
    timelock = newTimelock;
    emit TimelockUpdated(timelock);
  }

  function setOpenVaultFactory(bool state) external onlyRole(DEFAULT_ADMIN_ROLE) {
    openVaultFactory = state;
    emit OpenVaultFactory(state);
  }

  function deployVault(address _factory, bytes calldata _deployData, string calldata rating)
    external
    returns (address vault)
  {
    if (!allowedFactories[_factory]) {
      revert Chief__FactoryNotAllowed();
    }
    if (!openVaultFactory && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert Chief__missingRole(msg.sender, DEFAULT_ADMIN_ROLE);
    }
    vault = IVaultFactory(_factory).deployVault(_deployData);
    vaultSafetyRating[vault] = rating;
    _vaults.push(vault);
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

  /**
   * @notice Force pauses all actions from all vaults in `_vaults`.
   * Requirement:
   * - Should be restricted to pauser role.
   */
  function pauseForceAllVaults() external onlyRole(PAUSER_ROLE) {
    bytes memory callData = abi.encodeWithSelector(IPausableVault.pauseForceAll.selector);
    _changePauseState(callData);
  }

  /**
   * @notice Resumes all actions by force unpausing all vaults in `_vaults`.
   * Requirement:
   * - Should be restricted to unpauser role.
   */
  function unpauseForceAllVaults() external onlyRole(UNPAUSER_ROLE) {
    bytes memory callData = abi.encodeWithSelector(IPausableVault.unpauseForceAll.selector);
    _changePauseState(callData);
  }

  /**
   * @notice Pauses specific action in all vaults in `_vaults`.
   * @param action Enum: 0-deposit, 1-withdraw, 2-borrow, 3-payback.
   * Requirements:
   * - `action` in all vaults' should be not paused; otherwise revert.
   * - Should be restricted to pauser role.
   */
  function pauseActionInAllVaults(IPausableVault.VaultActions action)
    external
    onlyRole(PAUSER_ROLE)
  {
    bytes memory callData = abi.encodeWithSelector(IPausableVault.pause.selector, action);
    _changePauseState(callData);
  }

  /**
   * @notice Resumes specific `action` by unpausing in all vaults in `_vaults`.
   * @param action Enum: 0-deposit, 1-withdraw, 2-borrow, 3-payback.
   * Requirements:
   * - `action` in all vaults' should be in paused state; otherwise revert.
   * - Should be restricted to pauser role.
   */
  function upauseActionInAllVaults(IPausableVault.VaultActions action)
    external
    onlyRole(UNPAUSER_ROLE)
  {
    bytes memory callData = abi.encodeWithSelector(IPausableVault.unpause.selector, uint8(action));
    _changePauseState(callData);
  }

  /**
   * @dev Deploys 1 {AddrMapper} contract during Chief deployment.
   */
  function _deployAddrMapper() internal {
    addrMapper = address(new AddrMapper{salt: "0x00"}(address(this)));
  }

  /**
   * @dev executes pause state changes.
   */
  function _changePauseState(bytes memory callData) internal {
    console.log("_changePauseState: callData");
    console.logBytes(callData);
    uint256 alength = _vaults.length;
    for (uint256 i; i < alength;) {
      address(_vaults[i]).functionCall(callData, ": pause call failed");
      unchecked {
        ++i;
      }
    }
  }
}
