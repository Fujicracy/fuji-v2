// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Extended pausable contract for granular control on vault actions.
 * @author Fujidao Labs
 * @notice This contract is inspired on OpenZeppelin-Pausable contract.
 */

abstract contract PausableVault {
  enum VaultActions {
    Deposit,
    Withdraw,
    Borrow,
    Payback
  }

  /**
   * @dev Emitted when pause of `action` is triggered by `account`.
   */
  event Paused(address account, VaultActions actions);
  /**
   * @dev Emitted when the pause of `action` is lifted by `account`.
   */
  event Unpaused(address account, VaultActions actions);
  /**
   * @dev Emitted when forced pause all `VaultActions` triggered by `account`.
   */
  event PausedForceAll(address account);
  /**
   * @dev Emitted when forced pause is lifted to all `VaultActions` by `account`.
   */
  event UnpausedForceAll(address account);

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

  /**
   * @dev Returns true if the `action` in contract is paused, otherwise false.
   */
  function paused(VaultActions action) public virtual returns (bool) {
    return _actionsPaused[action];
  }

  /**
   * @notice See {PausableExt-_pauseForceAllActions}
   * @dev Should be implemented in child contract with access restriction.
   */
  function pauseForceAll() external virtual;
  /**
   * @notice See {PausableExt-_unpauseForceAllActions}
   * @dev Should be implemented in child contract with access restriction.
   */
  function unpauseForceAll() external virtual;
  /**
   * @notice See {PausableExt-_pause}
   * @param action Enum: 0-deposit, 1-withdraw, 2-borrow, 3-payback
   * @dev Should be implemented in child contract with access restriction.
   */
  function pause(VaultActions action) external virtual;
  /**
   * @notice See {PausableExt-_unpause}
   * @param action Enum: 0-deposit, 1-withdraw, 2-borrow, 3-payback
   * @dev Should be implemented in child contract with access restriction.
   */
  function unpause(VaultActions action) external virtual;

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
   * Requirements:
   * - The `VaultAction` in contract must not be paused.
   */
  function _pause(VaultActions action) internal whenNotPaused(action) {
    _actionsPaused[action] = true;
    emit Paused(msg.sender, action);
  }

  /**
   * @dev Returns `action` to normal state.
   * Requirements:
   * - The `VaultAction` in contract must be paused.
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
   * @dev Returns all `VaultActions`  to normal state.
   */
  function _unpauseForceAllActions() internal {
    _actionsPaused[VaultActions.Deposit] = false;
    _actionsPaused[VaultActions.Withdraw] = false;
    _actionsPaused[VaultActions.Borrow] = false;
    _actionsPaused[VaultActions.Payback] = false;
    emit UnpausedForceAll(msg.sender);
  }
}
