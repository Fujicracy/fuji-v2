// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

interface ISwapper {
  function swap(
    address assetIn,
    address assetOut,
    uint256 amountIn,
    uint256 amountOut,
    address receiver,
    address sweeper,
    uint256 minSweepOut
  )
    external;
}
