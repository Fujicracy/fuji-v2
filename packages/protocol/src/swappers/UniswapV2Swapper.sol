// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

/**
 * @title UniswapV2Swapper.
 * @author Fujidao Labs
 * @notice Wrapper of UniswapV2 to to be called from the router.
 */

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IUniswapV2Router01} from "../interfaces/uniswap/IUniswapV2Router01.sol";
import {IWETH9} from "../abstracts/WETH9.sol";
import {ISwapper} from "../interfaces/ISwapper.sol";
import {IFujiOracle} from "../interfaces/IFujiOracle.sol";

contract UniswapV2Swapper is ISwapper {
  using SafeERC20 for ERC20;

  IUniswapV2Router01 public uniswapRouter;
  IFujiOracle public oracle;

  IWETH9 public immutable WETH9;

  constructor(IWETH9 weth, IUniswapV2Router01 _uniswapRouter, IFujiOracle _oracle) {
    uniswapRouter = _uniswapRouter;
    oracle = _oracle;
    WETH9 = weth;
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

    ERC20(assetIn).safeTransferFrom(msg.sender, address(this), amounts[0]);
    ERC20(assetIn).safeApprove(address(uniswapRouter), amounts[0]);
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
