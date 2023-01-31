// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title ProxyReceiver
 *
 * @author Fujidao Labs
 *
 * @notice This contract helps forward ether or equivalent evm native token
 * using `address.call{value: x}()`for old implementations that still
 * use gas restricted obsolete methods such `address.send()` or
 * `address.transfer()`.
 */

import {ICToken} from "../interfaces/compoundV2/ICToken.sol";

contract ProxyReceiver {
  /**
   * @notice Receives a certain amount of assets.
   *
   * @dev This function is used in the integration of some protocols because the withdraw function runs out of gas.
   * This is used to withdraw the collateral and later on transfer it to the intended user through the withdraw function.
   */
  receive() external payable {}

  /**
   * @notice Withdraw native and transfer to msg.sender.
   *
   * @param amount integer amount to withdraw
   * @param cToken ICToken to interact with
   *
   * @dev msg.sender needs to transfer before calling this withdraw.
   */
  function withdraw(uint256 amount, ICToken cToken) external {
    require(cToken.redeemUnderlying(amount) == 0, "Withdraw-failed");

    (bool sent,) = msg.sender.call{value: amount}("");
    require(sent, "Failed to send native");
  }
}
