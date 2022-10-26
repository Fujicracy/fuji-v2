// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

/**
 * @title Periphery Payments
 * @notice Immutable state used by periphery contracts
 * Largely Forked from https://github.com/Uniswap/v3-periphery/blob/main/contracts/base/PeripheryPayments.sol
 * Changes:
 * no interface
 * no inheritdoc
 * add immutable WETH9 in constructor instead of PeripheryImmutableState
 * receive from any address
 * Solmate interfaces and transfer lib
 * casting
 * add approve, wrapWETH9 and pullToken
 * https://github.com/fei-protocol/ERC4626/blob/main/src/external/PeripheryPayments.sol
 */
abstract contract PeripheryPayments {
  using SafeERC20 for ERC20;

  IWETH9 public immutable WETH9;

  constructor(IWETH9 _WETH9) {
    WETH9 = _WETH9;
  }

  receive() external payable {}

  /*//////////////////////////////////////////////////////////////
                             ETH OPERATIONS
  //////////////////////////////////////////////////////////////*/

  function safeTransferETH(address to, uint256 amount) internal {
    bool success;
    assembly {
      // Transfer the ETH and store if it succeeded or not.
      success := call(gas(), to, amount, 0, 0, 0, 0)
    }
    require(success, "ETH_TRANSFER_FAILED");
  }

  function approve(ERC20 token, address to, uint256 amount) public payable {
    token.safeApprove(to, amount);
  }

  function unwrapWETH9(uint256 amountMinimum, address recipient) public payable {
    uint256 balanceWETH9 = WETH9.balanceOf(address(this));
    require(balanceWETH9 >= amountMinimum, "Insufficient WETH9");

    if (balanceWETH9 > 0) {
      WETH9.withdraw(balanceWETH9);
      safeTransferETH(recipient, balanceWETH9);
    }
  }

  function wrapWETH9() public payable {
    if (address(this).balance > 0) {
      WETH9.deposit{value: address(this).balance}();
    } // wrap everything
  }

  function pullToken(ERC20 token, uint256 amount, address recipient) public payable {
    token.safeTransferFrom(msg.sender, recipient, amount);
  }

  function pullTokenFrom(
    ERC20 token,
    uint256 amount,
    address recipient,
    address sender
  )
    public
    payable
  {
    token.safeTransferFrom(sender, recipient, amount);
  }

  function sweepToken(ERC20 token, uint256 amountMinimum, address recipient) public payable {
    uint256 balanceToken = token.balanceOf(address(this));
    require(balanceToken >= amountMinimum, "Insufficient token");

    if (balanceToken > 0) {
      token.safeTransfer(recipient, balanceToken);
    }
  }

  function refundETH() external payable {
    if (address(this).balance > 0) {
      safeTransferETH(msg.sender, address(this).balance);
    }
  }
}

abstract contract IWETH9 is ERC20 {
  /// @notice Deposit ether to get wrapped ether
  function deposit() external payable virtual;

  /// @notice Withdraw wrapped ether to get ether
  function withdraw(uint256) external virtual;
}
