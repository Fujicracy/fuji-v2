// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.9;

interface ISwapper {
  function swap(
    address assetIn,
    address assetOut,
    uint256 amountOut,
    address receiver,
    uint256 slippage
  )
    external;
}
