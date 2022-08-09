// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/**
 * @title Universal ERC20 Handler.
 * @author fujidao Labs
 * @notice Allows contract to handle both an ERC20 token or the native asset.
 */
library UniversalERC20 {
  IERC20 private constant _NATIVE_ADDRESS = IERC20(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
  IERC20 private constant _ZERO_ADDRESS = IERC20(0x0000000000000000000000000000000000000000);

  function isNative(IERC20 token) internal pure returns (bool) {
    return (token == _ZERO_ADDRESS || token == _NATIVE_ADDRESS);
  }

  function univBalanceOf(IERC20 token, address account) internal view returns (uint256) {
    if (isNative(token)) {
      return account.balance;
    } else {
      return token.balanceOf(account);
    }
  }

  function univTransfer(IERC20 token, address payable to, uint256 amount) internal {
    if (amount > 0) {
      if (isNative(token)) {
        (bool sent,) = to.call{value: amount}("");
        require(sent, "Failed to send Native");
      } else {
        token.transfer(to, amount);
      }
    }
  }

  function univApprove(IERC20 token, address to, uint256 amount) internal {
    require(!isNative(token), "Approve called on Native");

    if (amount == 0) {
      token.approve(to, 0);
    } else {
      uint256 allowance = token.allowance(address(this), to);
      if (allowance < amount) {
        if (allowance > 0) {
          token.approve(to, 0);
        }
        token.approve(to, amount);
      }
    }
  }
}
