// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

interface IUnwrapper {
  /**
   * @notice Convert wrappedNative to native and transfer to msg.sender
   * @param amount amount to withdraw.
   * @dev msg.sender needs to send WrappedNative before calling this withdraw
   */
  function withdraw(uint256 amount) external;
}
