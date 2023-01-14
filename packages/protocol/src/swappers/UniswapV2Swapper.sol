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

contract UniswapV2Swapper is ISwapper {
  using SafeERC20 for ERC20;

  error UniswapV2Swapper__swap_slippageTooHigh();

  IUniswapV2Router01 public uniswapRouter;

  IWETH9 public immutable WETH9;

  constructor(IWETH9 weth, IUniswapV2Router01 _uniswapRouter) {
    uniswapRouter = _uniswapRouter;
    WETH9 = weth;
  }

  /**
   * @dev Swap tokens. Slippage is controlled though `minSweepOut`.
   * If `minSweepOut` is 0, the slippage check gets skipped.
   *
   * @param assetIn The address of the ERC-20 token to swap from.
   * @param assetOut The address of the ERC-20 token to swap to.
   * @param amountIn The amount of `assetIn` that will be pulled from msg.sender.
   * @param amountOut The exact amount of `assetOut` required after the swap.
   * @param receiver The address that will receive `amountOut` tokens.
   * @param sweeper The address that will receive the leftovers after the swap.
   * @param minSweepOut The min amount of leftovers required.
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
    external
  {
    ERC20(assetIn).safeTransferFrom(msg.sender, address(this), amountIn);

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

    ERC20(assetIn).safeApprove(address(uniswapRouter), amounts[0]);
    // swap and transfer swapped amount to receiver (could be Flasher)
    uniswapRouter.swapTokensForExactTokens(
      amountOut,
      amounts[0],
      path,
      receiver,
      // solhint-disable-next-line
      block.timestamp
    );

    uint256 leftover = amountIn - amounts[0];
    if (minSweepOut > 0 && minSweepOut >= leftover) {
      revert UniswapV2Swapper__swap_slippageTooHigh();
    }
    // transfer the leftovers to sweeper
    ERC20(assetIn).safeTransfer(sweeper, leftover);
  }
}
