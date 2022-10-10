// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

interface IVelodromeRouter {
  function swapExactTokensForTokensSimple(
    uint256 amountIn,
    uint256 amountOutMin,
    address tokenFrom,
    address tokenTo,
    bool stable,
    address to,
    uint256 deadline
  )
    external;

  function quoteRemoveLiquidity(address tokenA, address tokenB, bool stable, uint256 liquidity)
    external
    view
    returns (uint256, uint256);
}
