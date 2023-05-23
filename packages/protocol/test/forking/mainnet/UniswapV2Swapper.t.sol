// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
import {ISwapper} from "../../../src/interfaces/ISwapper.sol";
import {UniswapV2Swapper} from "../../../src/swappers/UniswapV2Swapper.sol";
import {IUniswapV2Router01} from "../../../src/interfaces/uniswap/IUniswapV2Router01.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract UniswapV2SwapperForkingTests is Routines, ForkingSetup {
  ISwapper public swapper;
  address uniswapV2Router;

  function setUp() public {
    setUpFork(MAINNET_DOMAIN);

    uniswapV2Router = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    vm.label(uniswapV2Router, "UniswapV2Router");

    swapper = new UniswapV2Swapper(IWETH9(collateralAsset), IUniswapV2Router01(uniswapV2Router));
  }

  function test_simpleSwap() public {
    address assetIn = collateralAsset;
    address assetOut = debtAsset;

    uint256 amountOut = 1000e6;
    uint256 amountIn = swapper.getAmountIn(assetIn, assetOut, amountOut);
    uint256 minSweepOut = 0;

    deal(assetIn, ALICE, amountIn);
    vm.startPrank(ALICE);
    IERC20(assetIn).approve(address(swapper), amountIn);
    swapper.swap(assetIn, assetOut, amountIn, amountOut, ALICE, ALICE, minSweepOut);
    vm.stopPrank();

    assertEq(IERC20(assetIn).balanceOf(ALICE), 0);
    assertEq(IERC20(assetOut).balanceOf(ALICE), amountOut);
  }

  function test_slippageCheckSwap() public {
    address assetIn = collateralAsset;
    address assetOut = debtAsset;

    uint256 desiredAmountOut = 1000e6;
    uint256 desiredAmountIn = swapper.getAmountIn(assetIn, assetOut, desiredAmountOut);

    uint256 excessAmountIn = 2 * desiredAmountIn;
    uint256 minSweepOut = excessAmountIn - desiredAmountIn;

    deal(assetIn, ALICE, excessAmountIn);
    vm.startPrank(ALICE);
    IERC20(assetIn).approve(address(swapper), excessAmountIn);
    swapper.swap(assetIn, assetOut, excessAmountIn, desiredAmountOut, ALICE, ALICE, minSweepOut);
    vm.stopPrank();

    assertEq(IERC20(assetIn).balanceOf(ALICE), minSweepOut);
    assertEq(IERC20(assetOut).balanceOf(ALICE), desiredAmountOut);
  }

  function test_revertNotEnoughAmountIn() public {
    address assetIn = collateralAsset;
    address assetOut = debtAsset;

    uint256 amountOut = 1000e6;
    uint256 amountIn = swapper.getAmountIn(assetIn, assetOut, amountOut);
    uint256 smallerAmountIn = amountIn / 2;
    uint256 minSweepOut = 0;

    deal(assetIn, ALICE, amountIn);
    vm.startPrank(ALICE);
    IERC20(assetIn).approve(address(swapper), amountIn);
    vm.expectRevert(UniswapV2Swapper.UniswapV2Swapper__swap_notEnoughAmountIn.selector);
    swapper.swap(assetIn, assetOut, smallerAmountIn, amountOut, ALICE, ALICE, minSweepOut);
    vm.stopPrank();

    assertEq(IERC20(assetIn).balanceOf(ALICE), amountIn);
    assertEq(IERC20(assetOut).balanceOf(ALICE), 0);
  }
}
