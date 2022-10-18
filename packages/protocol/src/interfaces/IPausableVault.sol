// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Pausable Vault interface.
 * @author Fujidao Labs
 * @notice Defines interface for {PausableVault} operations.
 */

interface IPausableVault {
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

  /**
   * @dev Returns true if the `action` in contract is paused, otherwise false.
   */
  function paused(VaultActions action) external view returns (bool);
  /**
   * @notice Forces stopped state for all `VaultActions`.
   * Requirements:
   * - Should be implemented in vault contract with access restriction.
   */
  function pauseForceAll() external;
  /**
   * @notice Returns force all `VaultActions` to normal state.
   * Requirements:
   * - Should be implemented in vault contract with access restriction.
   */
  function unpauseForceAll() external;
  /**
   * @notice Triggers stopped state for `action`.
   * @param action Enum: 0-deposit, 1-withdraw, 2-borrow, 3-payback.
   * Requirements:
   * - The `VaultAction` in contract must not be paused.
   * - Should be implemented in vault contract with access restriction.
   */
  function pause(VaultActions action) external;
  /**
   * @notice Returns `action` to normal state.
   * @param action Enum: 0-deposit, 1-withdraw, 2-borrow, 3-payback
   * Requirements:
   * - The `VaultAction` in contract must be paused.
   * - Should be implemented in child contract with access restriction.
   */
  function unpause(VaultActions action) external;
}
