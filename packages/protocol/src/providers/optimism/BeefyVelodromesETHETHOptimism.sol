// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IUniswapRouterSolidly} from "../../interfaces/beefy/IUniswapRouterSolidly.sol";
import {IUniswapV2Pair} from "../../interfaces/beefy/IUniswapV2Pair.sol";
import {IBeefyVaultV6} from "../../interfaces/beefy/IBeefyVaultV6.sol";

/**
 * @title Beefy Velodrome sETH-ETH Optimism Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with this specific vault.
 */
contract BeefyVelodromesETHETHOptimism is ILendingProvider {
  using Math for uint256;
  using SafeERC20 for IERC20;

  function _getBeefyVault() internal pure returns (address) {
    return 0xf92129fE0923d766C2540796d4eA31Ff9FF65522;
  }

  function _getSolidlyRouter() internal pure returns (IUniswapRouterSolidly) {
    return IUniswapRouterSolidly(0xa132DAB612dB5cB9fC9Ac426A0Cc215A3423F9c9);
  }

  /**
   * @notice See {ILendingProvider}
   */
  function approvedOperator(address) external pure override returns (address operator) {}

  /**
   * @notice See {ILendingProvider}
   */
  function deposit(address asset, uint256 amount) external override returns (bool success) {
    _swapAndStake(asset);
    return true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function borrow(address asset, uint256 amount) external override returns (bool success) {}

  /**
   * @notice See {ILendingProvider}
   */
  function withdraw(address asset, uint256 amount) external override returns (bool success) {}

  /**
   * @notice See {ILendingProvider}
   */
  function payback(address asset, uint256 amount) external override returns (bool success) {}

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositRateFor(address asset) external view override returns (uint256 rate) {}

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowRateFor(address asset) external view override returns (uint256 rate) {}

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositBalance(address asset, address user)
    external
    view
    override
    returns (uint256 balance)
  {
    balance = IERC20(asset).balanceOf(user);
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowBalance(address asset, address user)
    external
    view
    override
    returns (uint256 balance)
  {}

  function _swapAndStake(address tokenIn) private {
    address beefyVault = _getBeefyVault();

    (IBeefyVaultV6 vault, IUniswapV2Pair pair) = _getVaultPair(beefyVault);

    (uint256 reserveA, uint256 reserveB,) = pair.getReserves();

    bool isInputA = pair.token0() == tokenIn;
    require(isInputA || pair.token1() == tokenIn, "Beefy: Input token not present in liqudity pair");

    address[] memory path = new address[](2);
    path[0] = tokenIn;
    path[1] = isInputA ? pair.token1() : pair.token0();

    uint256 fullInvestment = IERC20(tokenIn).balanceOf(address(this));
    uint256 swapAmountIn;
    if (isInputA) {
      swapAmountIn = _getSwapAmount(pair, fullInvestment, reserveA, reserveB, path[0], path[1]);
    } else {
      swapAmountIn = _getSwapAmount(pair, fullInvestment, reserveB, reserveA, path[0], path[1]);
    }

    IUniswapRouterSolidly router = _getSolidlyRouter();
    // 1% slippage
    uint256 tokenAmountOutMin =
      _getSwapAmount(pair, fullInvestment, reserveB, reserveA, path[0], path[1]).mulDiv(99, 100);
    console.log(tokenAmountOutMin);

    _approveTokenIfNeeded(path[0], address(router));
    uint256[] memory swapedAmounts = router.swapExactTokensForTokensSimple(
      swapAmountIn,
      tokenAmountOutMin,
      path[0],
      path[1],
      pair.stable(),
      address(this),
      block.timestamp
    );

    _approveTokenIfNeeded(path[1], address(router));
    (,, uint256 amountLiquidity) = router.addLiquidity(
      path[0],
      path[1],
      pair.stable(),
      fullInvestment - swapedAmounts[0],
      swapedAmounts[1],
      1,
      1,
      address(this),
      block.timestamp
    );

    _approveTokenIfNeeded(address(pair), address(vault));
    vault.deposit(amountLiquidity);
  }

  function _getVaultPair(address beefyVault)
    private
    pure
    returns (IBeefyVaultV6 vault, IUniswapV2Pair pair)
  {
    vault = IBeefyVaultV6(beefyVault);
    pair = IUniswapV2Pair(vault.want());
  }

  function _getSwapAmount(
    IUniswapV2Pair pair,
    uint256 investmentA,
    uint256 reserveA,
    uint256 reserveB,
    address tokenA,
    address tokenB
  )
    private
    view
    returns (uint256 swapAmount)
  {
    uint256 halfInvestment = investmentA / 2;

    if (pair.stable()) {
      swapAmount = _getStableSwap(pair, investmentA, halfInvestment, tokenA, tokenB);
    } else {
      uint256 nominator = pair.getAmountOut(halfInvestment, tokenA);
      uint256 denominator = halfInvestment * (reserveB - nominator) / (reserveA + halfInvestment);
      swapAmount =
        investmentA - (Math.sqrt(halfInvestment * halfInvestment * nominator / denominator));
    }
  }

  function _approveTokenIfNeeded(address token, address spender) private {
    if (IERC20(token).allowance(address(this), spender) == 0) {
      IERC20(token).safeApprove(spender, type(uint256).max);
    }
  }

  function _getStableSwap(
    IUniswapV2Pair pair,
    uint256 investmentA,
    uint256 halfInvestment,
    address tokenA,
    address tokenB
  )
    private
    view
    returns (uint256 swapAmount)
  {
    uint256 out = pair.getAmountOut(halfInvestment, tokenA);

    IUniswapRouterSolidly router = _getSolidlyRouter();
    (uint256 amountA, uint256 amountB,) =
      router.quoteAddLiquidity(tokenA, tokenB, pair.stable(), halfInvestment, out);

    amountA = amountA * 1e18 / 10 ** IERC20Metadata(tokenA).decimals();
    amountB = amountB * 1e18 / 10 ** IERC20Metadata(tokenB).decimals();
    out = out * 1e18 / 10 ** IERC20Metadata(tokenB).decimals();
    halfInvestment = halfInvestment * 1e18 / 10 ** IERC20Metadata(tokenA).decimals();

    uint256 ratio = out * 1e18 / halfInvestment * amountA / amountB;

    return investmentA * 1e18 / (ratio + 1e18);
  }
}
