// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title UniswapV2Swapper
 *
 * @author Fujidao Labs
 *
 * @notice UniswapV2 adaptor contract to to be called from the {BaseRouter} type
 * contracts and perform token swaps.
 */

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IUniswapV2Router01} from "../interfaces/uniswap/IUniswapV2Router01.sol";
import {IWETH9} from "../abstracts/WETH9.sol";
import {ISwapper} from "../interfaces/ISwapper.sol";

contract UniswapV2Swapper is ISwapper {
  using SafeERC20 for ERC20;

  /// @dev Custom Errors
  error UniswapV2Swapper__swap_slippageTooHigh();
  error UniswapV2Swapper__swap_notEnoughAmountIn();

  IUniswapV2Router01 public uniswapRouter;

  IWETH9 public immutable WETH9;

  /**
   * @notice Creates a new {UniswapV2Swapper}
   *
   * @param weth wrapped native address
   * @param uniswapRouter_ contract address
   */

  constructor(IWETH9 weth, IUniswapV2Router01 uniswapRouter_) {
    uniswapRouter = uniswapRouter_;
    WETH9 = weth;
  }

  /// @inheritdoc ISwapper
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

    uint256 computedAmountIn = getAmountIn(assetIn, assetOut, amountOut);

    if (amountIn < computedAmountIn) {
      revert UniswapV2Swapper__swap_notEnoughAmountIn();
    }

    address[] memory path = _buildPath(assetIn, assetOut);

    ERC20(assetIn).safeIncreaseAllowance(address(uniswapRouter), computedAmountIn);
    // Swap, then transfer the swapped amount to receiver (could be Flasher).
    uniswapRouter.swapTokensForExactTokens(
      amountOut,
      computedAmountIn,
      path,
      receiver,
      // solhint-disable-next-line
      block.timestamp
    );

    uint256 leftover = amountIn - computedAmountIn;
    if (minSweepOut > 0 && minSweepOut > leftover) {
      revert UniswapV2Swapper__swap_slippageTooHigh();
    }
    // Transfer the leftovers to `sweeper`.
    ERC20(assetIn).safeTransfer(sweeper, leftover);
  }

  /// @inheritdoc ISwapper
  function getAmountIn(
    address assetIn,
    address assetOut,
    uint256 amountOut
  )
    public
    view
    override
    returns (uint256 amountIn)
  {
    address[] memory path = _buildPath(assetIn, assetOut);
    uint256[] memory amounts = uniswapRouter.getAmountsIn(amountOut, path);
    amountIn = amounts[0];
  }

  /// @inheritdoc ISwapper
  function getAmountOut(
    address assetIn,
    address assetOut,
    uint256 amountIn
  )
    public
    view
    override
    returns (uint256 amountOut)
  {
    address[] memory path = _buildPath(assetIn, assetOut);
    uint256[] memory amounts = uniswapRouter.getAmountsOut(amountIn, path);
    amountOut = amounts[amounts.length - 1];
  }

  /**
   * @dev Build trade path for swap.
   * Requirements:
   * - Must use WETH as a path when neither `assetIn` or `assetOut` are WETH.
   *
   * @param assetIn address
   * @param assetOut address
   */
  function _buildPath(
    address assetIn,
    address assetOut
  )
    internal
    view
    returns (address[] memory path)
  {
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
  }
}
