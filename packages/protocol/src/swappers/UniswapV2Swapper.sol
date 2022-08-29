// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

/**
 * @title UniswapV2Swapper.
 * @author Fujidao Labs
 * @notice Wrapper of UniswapV2 to to be called from the router.
 */

import {IUniswapV2Router01} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import {PeripheryPayments, IWETH9, ERC20} from "../helpers/PeripheryPayments.sol";
import {ISwapper} from "../interfaces/ISwapper.sol";
import {IFujiOracle} from "../interfaces/IFujiOracle.sol";

contract UniswapV2Swapper is PeripheryPayments, ISwapper {
  IUniswapV2Router01 public uniswapRouter;
  IFujiOracle public oracle;

  constructor(IWETH9 weth, IUniswapV2Router01 _uniswapRouter, IFujiOracle _oracle)
    PeripheryPayments(weth)
  {
    uniswapRouter = _uniswapRouter;
    oracle = _oracle;
  }

  function swap(
    address assetIn,
    address assetOut,
    uint256 amountOut,
    address receiver,
    uint256 slippage
  )
    external
  {
    address[] memory path;
    if (assetIn == address(WETH9) || assetOut == address(WETH9)) {
      path = new address[](2);
      path[0] = assetIn;
      path[1] = assetOut;
    } else {
      path = new address[](3);
      path[0] = assetIn;
      path[1] = address(WETH9);
      path[2] = assetOut;
    }

    uint256[] memory amounts = uniswapRouter.getAmountsIn(amountOut, path);
    slippage;
    // TODO check for slippage with value from oracle

    pullToken(ERC20(assetIn), amounts[0], address(this));
    approve(ERC20(assetIn), address(uniswapRouter), amounts[0]);
    // swap and transfer swapped amount to Flasher
    uniswapRouter.swapTokensForExactTokens(
      amountOut,
      amounts[0],
      path,
      receiver,
      // solhint-disable-next-line
      block.timestamp
    );
  }
}
