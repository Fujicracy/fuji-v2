// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/// @notice Tokenised representation of debts
interface IEulerDToken {
  /// @notice Address of underlying asset
  function underlyingAsset() external view returns (address);

  /// @notice Debt owed by a particular account, in underlying units
  function balanceOf(address account) external view returns (uint256);

  /// @notice Transfer underlying tokens from the Euler pool to the sender, and increase sender's dTokens
  /// @param subAccountId 0 for primary, 1-255 for a sub-account
  /// @param amount In underlying units (use max uint256 for all available tokens)
  function borrow(uint256 subAccountId, uint256 amount) external;

  /// @notice Transfer underlying tokens from the sender to the Euler pool, and decrease sender's dTokens
  /// @param subAccountId 0 for primary, 1-255 for a sub-account
  /// @param amount In underlying units (use max uint256 for full debt owed)
  function repay(uint256 subAccountId, uint256 amount) external;

  /// @notice Request a flash-loan. A onFlashLoan() callback in msg.sender will be invoked, which must repay the loan to the main Euler address prior to returning.
  /// @param amount In underlying units
  /// @param data Passed through to the onFlashLoan() callback, so contracts don't need to store transient data in storage
  function flashLoan(uint256 amount, bytes calldata data) external;
}
