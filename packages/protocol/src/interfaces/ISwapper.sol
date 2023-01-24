// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Swapper interface.
 * @author fujidao Labs
 * @notice  Defines the interface for routers to perform token swaps with DEX protocols.
 * @dev Implementation should be permisionless.
 */

interface ISwapper {
  /**
   * @notice Swap tokens.
   * @dev Slippage is controlled though `minSweepOut`.
   * If `minSweepOut` is 0, the slippage check gets skipped.
   * @param assetIn The address of the ERC-20 token to swap from.
   * @param assetOut The address of the ERC-20 token to swap to.
   * @param amountIn The amount of `assetIn` that will be pulled from msg.sender.
   * @param amountOut The exact amount of `assetOut` required after the swap.
   * @param receiver The address that will receive `amountOut` tokens.
   * @param sweeper The address that will receive the leftovers after the swap.
   * @param minSweepOut The min amount of `assetIn` leftover expected after swap.
   */
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

  /**
   * @notice Estimate the amount of `assetIn` required for swap.
   * @param assetIn The address of the ERC-20 token to swap from.
   * @param assetOut The address of the ERC-20 token to swap to.
   * @param amountOut The exact expected amount of `assetOut` after the swap.
   */
  function getAmountIn(
    address assetIn,
    address assetOut,
    uint256 amountOut
  )
    external
    view
    returns (uint256 amountIn);

  /**
   * @notice Estimate the amount of `assetOut` received after swap.
   * @param assetIn The address of the ERC-20 token to swap from.
   * @param assetOut The address of the ERC-20 token to swap to.
   * @param amountIn The exact amount of `assetIn` to perform swap.
   */
  function getAmountOut(
    address assetIn,
    address assetOut,
    uint256 amountIn
  )
    external
    view
    returns (uint256 amountOut);
}
