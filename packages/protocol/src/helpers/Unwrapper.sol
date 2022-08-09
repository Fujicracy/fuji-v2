// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import "../interfaces/IUnwrapper.sol";
import "../interfaces/IWETH.sol";

contract Unwrapper is IUnwrapper {
  address public immutable wNative;

  constructor(address _wNative) {
    wNative = _wNative;
  }

  receive() external payable {}

  /**
   * @notice See {IUnwrapper}.
   */
  function withdraw(uint256 amount) external {
    IWETH(wNative).withdraw(amount);
    (bool sent,) = msg.sender.call{value: amount}("");
    require(sent, "Failed to send native");
  }
}
