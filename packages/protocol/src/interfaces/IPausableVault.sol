// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title IPausableVault
 * @author Fujidao Labs
 *
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
   *
   * @param account address who called the pause
   * @param action type being paused
   */
  event Paused(address account, VaultActions action);
  /**
   * @dev Emitted when the pause of `action` is lifted by `account`.
   *
   * @param account address who called the unpause
   * @param action type being paused
   */
  event Unpaused(address account, VaultActions action);
  /**
   * @dev Emitted when forced pause all `VaultActions` triggered by `account`.
   *
   * @param account address who called all pause
   */
  event PausedForceAll(address account);
  /**
   * @dev Emitted when forced pause is lifted to all `VaultActions` by `account`.
   *
   * @param account address who called the all unpause
   */
  event UnpausedForceAll(address account);

  /**
   * @notice Returns true if the `action` in contract is paused, otherwise false.
   *
   * @param action to check pause status
   */
  function paused(VaultActions action) external view returns (bool);

  /**
   * @notice Force pause state for all `VaultActions`.
   * Requirements:
   * - Must be implemented in vault contract with access restriction.
   */
  function pauseForceAll() external;

  /**
   * @notice Force unpause state for all `VaultActions`.
   * Requirements:
   * - Must be implemented in vault contract with access restriction.
   */
  function unpauseForceAll() external;

  /**
   * @notice Set paused state for `action` of this vault.
   * Requirements:
   * - The `VaultActions` in contract must not be paused.
   * - Must be implemented in vault contract with access restriction.
   *
   * @param action Enum: 0-deposit, 1-withdraw, 2-borrow, 3-payback
   */
  function pause(VaultActions action) external;

  /**
   * @notice Set unpause state for `action` of this vault.
   * Requirements:
   * - The `VaultActions` in contract must be paused.
   * - Must be implemented in child contract with access restriction.
   *
   * @param action Enum: 0-deposit, 1-withdraw, 2-borrow, 3-payback
   */
  function unpause(VaultActions action) external;
}
