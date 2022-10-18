// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Extended pausable contract for granular control on vault actions.
 * @author Fujidao Labs
 * @notice This contract is inspired on OpenZeppelin-Pausable contract.
 */

import {IPausableVault} from "../interfaces/IPausableVault.sol";

abstract contract PausableVault is IPausableVault {
  error PausableExt__ActionPaused();
  error PausableExt__ActionNotPaused();

  mapping(VaultActions => bool) private _actionsPaused;

  /**
   * @dev Modifier to make a function callable only when `VaultAction` in the contract is not paused.
   * Requirements:
   * - The `VaultAction` in contract must not be paused.
   */
  modifier whenNotPaused(VaultActions action) {
    _requireNotPaused(action);
    _;
  }

  /**
   * @dev Modifier to make a function callable only when `VaultAction` the contract is paused.
   * Requirements:
   * - The `VaultAction` in contract must be paused.
   */
  modifier whenPaused(VaultActions action) {
    _requirePaused(action);
    _;
  }

  /// inherit IPausableVault
  function paused(VaultActions action) public view virtual returns (bool) {
    return _actionsPaused[action];
  }

  /// inheritdoc IPausableVault
  function pauseForceAll() external virtual override;

  /// inheritdoc IPausableVault
  function unpauseForceAll() external virtual override;

  /// inheritdoc IPausableVault
  function pause(VaultActions action) external virtual override;

  /// inheritdoc IPausableVault
  function unpause(VaultActions action) external virtual override;

  /**
   * @dev Throws if the `action` in contract is paused.
   */
  function _requireNotPaused(VaultActions action) private view {
    if (_actionsPaused[action] == true) {
      revert PausableExt__ActionPaused();
    }
  }

  /**
   * @dev Throws if the `action` in contract is not paused.
   */
  function _requirePaused(VaultActions action) private view {
    if (_actionsPaused[action] == false) {
      revert PausableExt__ActionNotPaused();
    }
  }

  /**
   * @dev Triggers stopped state for `action`.
   */
  function _pause(VaultActions action) internal whenNotPaused(action) {
    _actionsPaused[action] = true;
    emit Paused(msg.sender, action);
  }

  /**
   * @dev Returns `action` to normal state.
   */
  function _unpause(VaultActions action) internal whenPaused(action) {
    _actionsPaused[action] = false;
    emit Paused(msg.sender, action);
  }

  /**
   * @dev Forces stopped state for all `VaultActions`.
   */
  function _pauseForceAllActions() internal {
    _actionsPaused[VaultActions.Deposit] = true;
    _actionsPaused[VaultActions.Withdraw] = true;
    _actionsPaused[VaultActions.Borrow] = true;
    _actionsPaused[VaultActions.Payback] = true;
    emit PausedForceAll(msg.sender);
  }

  /**
   * @dev Returns all `VaultActions` to normal state.
   */
  function _unpauseForceAllActions() internal {
    _actionsPaused[VaultActions.Deposit] = false;
    _actionsPaused[VaultActions.Withdraw] = false;
    _actionsPaused[VaultActions.Borrow] = false;
    _actionsPaused[VaultActions.Payback] = false;
    emit UnpausedForceAll(msg.sender);
  }
}
