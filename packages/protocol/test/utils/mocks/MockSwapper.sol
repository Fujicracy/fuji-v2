// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

contract MockSwapper {
  function swapTokensForExactTokens(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
  )
    external
    pure
    returns (uint256[] memory amounts)
  {
    amountOut;
    amountInMax;
    path;
    to;
    deadline;
    amounts;
  }

  function getAmountsIn(uint256 amountOut, address[] memory path)
    public
    pure
    returns (uint256[] memory amounts)
  {
    amountOut;
    path;
    amounts;
  }
}
