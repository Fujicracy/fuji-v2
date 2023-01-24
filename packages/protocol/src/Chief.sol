// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title Chief.
 * @author fujidao Labs
 * @notice  Controls vault deploy factories, deployed flashers, vault ratings and core access control.
 * Vault deployer contract with template factory allow.
 * ref: https://github.com/sushiswap/trident/blob/master/contracts/deployer/MasterDeployer.sol
 */

import {AccessControl} from "openzeppelin-contracts/contracts/access/AccessControl.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";
import {IPausableVault} from "./interfaces/IPausableVault.sol";
import {IVaultFactory} from "./interfaces/IVaultFactory.sol";
import {IChief} from "./interfaces/IChief.sol";
import {AddrMapper} from "./helpers/AddrMapper.sol";
import {CoreRoles} from "./access/CoreRoles.sol";

contract Chief is CoreRoles, AccessControl, IChief {
  using Address for address;

  event OpenVaultFactory(bool state);
  event DeployVault(address indexed factory, address indexed vault, bytes deployData);
  event AllowFlasher(address indexed flasher, bool allowed);
  event AllowVaultFactory(address indexed factory, bool allowed);
  event TimelockUpdated(address indexed timelock);
  event SafetyRatingChange(address vault, uint256 newRating);

  /// @dev Custom Errors
  error Chief__checkInput_zeroAddress();
  error Chief__allowFlasher_noAllowChange();
  error Chief__allowVaultFactory_noAllowChange();
  error Chief__deployVault_factoryNotAllowed();
  error Chief__deployVault_missingRole(address account, bytes32 role);
  error Chief__onlyTimelock_callerIsNotTimelock();
  error Chief__checkRatingValue_notInRange();
  error Chief__checkValidVault_notValidVault();

  bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");

  address public timelock;
  address public addrMapper;
  bool public openVaultFactory;

  address[] internal _vaults;
  mapping(address => uint256) public vaultSafetyRating;
  mapping(address => bool) public allowedVaultFactory;
  mapping(address => bool) public allowedFlasher;

  modifier onlyTimelock() {
    if (msg.sender != timelock) {
      revert Chief__onlyTimelock_callerIsNotTimelock();
    }
    _;
  }

  constructor(bool deployTimelock, bool deployAddrMapper) {
    _grantRole(DEPLOYER_ROLE, msg.sender);
    _grantRole(HOUSE_KEEPER_ROLE, msg.sender);
    _grantRole(PAUSER_ROLE, address(this));
    _grantRole(UNPAUSER_ROLE, address(this));
    if (deployTimelock) _deployTimelockController();
    if (deployAddrMapper) _deployAddrMapper();
  }

  function getVaults() external view returns (address[] memory) {
    return _vaults;
  }

  function setTimelock(address newTimelock) external onlyTimelock {
    _checkInputIsNotZeroAddress(newTimelock);
    // Revoke admin role from current timelock
    _revokeRole(DEFAULT_ADMIN_ROLE, timelock);
    // Assign `timelock` to new timelock address
    timelock = newTimelock;
    // grant admin role to new timelock address
    _grantRole(DEFAULT_ADMIN_ROLE, timelock);
    emit TimelockUpdated(newTimelock);
  }

  function setOpenVaultFactory(bool state) external onlyTimelock {
    openVaultFactory = state;
    emit OpenVaultFactory(state);
  }

  function deployVault(
    address factory,
    bytes calldata deployData,
    uint256 rating
  )
    external
    returns (address vault)
  {
    if (!allowedVaultFactory[factory]) {
      revert Chief__deployVault_factoryNotAllowed();
    }
    if (!openVaultFactory && !hasRole(DEPLOYER_ROLE, msg.sender)) {
      revert Chief__deployVault_missingRole(msg.sender, DEPLOYER_ROLE);
    }
    _checkRatingValue(rating);

    vault = IVaultFactory(factory).deployVault(deployData);
    vaultSafetyRating[vault] = rating;
    _vaults.push(vault);

    emit DeployVault(factory, vault, deployData);
  }

  /**
   * @notice Sets `vaultSafetyRating` for `vault`.
   * Requirements:
   *  - Emits a `SafetyRatingChange` event.
   *  - Only timelock can change rating.
   *  - `newRating` is in range [1=100].
   *  - `vault_` is not zero address.
   */
  function setSafetyRating(address vault, uint256 newRating) external onlyTimelock {
    _checkValidVault(vault);
    _checkRatingValue(newRating);

    vaultSafetyRating[vault] = newRating;

    emit SafetyRatingChange(vault, newRating);
  }

  /**
   * @notice Set `flasher` as an authorized address for flashloan operations.
   * - Emits a `AllowFlasher` event.
   */
  function allowFlasher(address flasher, bool allowed) external onlyTimelock {
    _checkInputIsNotZeroAddress(flasher);
    if (allowedFlasher[flasher] == allowed) {
      revert Chief__allowFlasher_noAllowChange();
    }
    allowedFlasher[flasher] = allowed;
    emit AllowFlasher(flasher, allowed);
  }

  /**
   * @notice Sets `factory` as an authorized address for vault deployments.
   * - Emits a `AllowVaultFactory` event.
   */
  function allowVaultFactory(address factory, bool allowed) external onlyTimelock {
    _checkInputIsNotZeroAddress(factory);
    if (allowedVaultFactory[factory] == allowed) {
      revert Chief__allowVaultFactory_noAllowChange();
    }
    allowedVaultFactory[factory] = allowed;
    emit AllowVaultFactory(factory, allowed);
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
   * @dev Deploys 1 {TimelockController} contract during Chief deployment.
   */
  function _deployTimelockController() internal {
    address[] memory admins = new address[](1);
    admins[0] = msg.sender;
    timelock = address(new TimelockController{salt: "0x00"}(1 days, admins, admins));
    _grantRole(DEFAULT_ADMIN_ROLE, timelock);
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
    uint256 alength = _vaults.length;
    for (uint256 i; i < alength;) {
      address(_vaults[i]).functionCall(callData, ": pause call failed");
      unchecked {
        ++i;
      }
    }
  }

  /**
   * @dev reverts if `input` is zero address.
   */
  function _checkInputIsNotZeroAddress(address input) internal pure {
    if (input == address(0)) {
      revert Chief__checkInput_zeroAddress();
    }
  }

  /**
   * @dev reverts if `rating` input is not in range [1,100].
   */
  function _checkRatingValue(uint256 rating) internal pure {
    if (rating == 0 || rating > 100) {
      revert Chief__checkRatingValue_notInRange();
    }
  }

  /**
   * @dev reverts if `vault` is not in `_vaults` array.
   */
  function _checkValidVault(address vault) internal view {
    _checkInputIsNotZeroAddress(vault);
    uint256 len = _vaults.length;
    bool isInVaultList;
    for (uint256 i = 0; i < len;) {
      if (vault == _vaults[i]) {
        isInVaultList = true;
      }
      unchecked {
        ++i;
      }
    }
    if (!isInVaultList) {
      revert Chief__checkValidVault_notValidVault();
    }
  }
}
