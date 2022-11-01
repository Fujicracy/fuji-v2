// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

interface IBeefyUniV2ZapVelodrome {
  function beefIn(
    address beefyVault,
    uint256 tokenAmountOutMin,
    address tokenIn,
    uint256 tokenInAmount
  )
    external;

  function beefOutAndSwap(
    address beefyVault,
    uint256 withdrawAmount,
    address desiredToken,
    uint256 desiredTokenOutMin
  )
    external;

  function estimateSwap(
    address beefyVault,
    address tokenIn,
    uint256 fullInvestmentIn
  )
    external
    view
    returns (uint256 swapAmountIn, uint256 swapAmountOut, address swapTokenOut);
}
