// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {ICToken} from "./ICToken.sol";

/**
 * @title IProxyReceiver helper interface
 * @author Fujidao Labs
 * @notice Defines interface for ProxyReceiver.
 */
interface IProxyReceiver {
  /**
   * @notice Withdraw native and transfer to msg.sender.
   * @dev msg.sender needs to transfer before calling this withdraw.
   * @param amount integer amount to withdraw.
   * @param cToken ICToken to interact with.
   */
  function withdraw(uint256 amount, ICToken cToken) external;
}
