// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {ICToken} from "../interfaces/compoundV2/ICToken.sol";

contract ProxyReceiver {
  receive() external payable {}

  /**
   * @notice Withdraw native and transfer to msg.sender
   * @dev msg.sender needs to transfer before calling this withdraw
   * @param amount amount to withdraw.
   * @param cToken cToken to interact with.
   */
  function withdraw(uint256 amount, ICToken cToken) external {
    require(cToken.redeemUnderlying(amount) == 0, "Withdraw-failed");

    (bool sent,) = msg.sender.call{value: amount}("");
    require(sent, "Failed to send native");
  }
}
