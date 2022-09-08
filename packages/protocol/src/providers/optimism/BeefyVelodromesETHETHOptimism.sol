// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IBeefyVaultV6} from "../../interfaces/beefy/IBeefyVaultV6.sol";
import {IBeefyUniV2ZapSolidly} from "../../interfaces/beefy/IBeefyUniV2ZapSolidly.sol";

interface IUniswapV2Pair is IERC20 {
  function tokens() external returns (address, address);
  function transferFrom(address src, address dst, uint256 amount) external returns (bool);
  function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
  function burn(address to) external returns (uint256 amount0, uint256 amount1);
  function mint(address to) external returns (uint256 liquidity);
  function getReserves() external view returns (uint256 reserve0, uint256 reserve1, uint256 last);
  function token0() external view returns (address);
  function token1() external view returns (address);
  function stable() external view returns (bool);
  function getAmountOut(uint256, address) external view returns (uint256);
}

interface ISolidlyRouter {
  function swapExactTokensForTokensSimple(
    uint256,
    uint256,
    address,
    address,
    bool,
    address,
    uint256
  )
    external;

  function quoteAddLiquidity(address, address, bool, uint256, uint256)
    external
    view
    returns (uint256, uint256, uint256);

  function quoteRemoveLiquidity(address, address, bool, uint256)
    external
    view
    returns (uint256, uint256);
}

/**
 * @title Beefy Velodrome sETH-ETH Optimism Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with this specific vault.
 */
contract BeefyVelodromesETHETHOptimism is ILendingProvider {
  using SafeERC20 for IERC20;
  using Math for uint256;

  function _getBeefyVault() internal pure returns (address) {
    return 0xf92129fE0923d766C2540796d4eA31Ff9FF65522;
  }

  function _getSolidlyRouter() internal pure returns (address) {
    return 0xa132DAB612dB5cB9fC9Ac426A0Cc215A3423F9c9;
  }

  function _getBeefyZap() internal pure returns (address) {
    return 0x9b50B06B81f033ca86D70F0a44F30BD7E0155737;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function approvedOperator(address) external pure override returns (address operator) {
    operator = _getBeefyZap();
  }

  /**
   * @notice See {ILendingProvider}
   */
  function deposit(address asset, uint256 amount) external override returns (bool success) {
    address zap = _getBeefyZap();
    address beefyVault = _getBeefyVault();

    (, uint256 swapAmountOut,) = IBeefyUniV2ZapSolidly(zap).estimateSwap(beefyVault, asset, amount);

    // allow up to 1% slippage
    /*uint256 minAmountOut = swapAmountOut.mulDiv(999, 1000);*/
    IBeefyUniV2ZapSolidly(zap).beefIn(beefyVault, swapAmountOut, asset, amount);

    return true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function borrow(address asset, uint256 amount) external override returns (bool success) {}

  /**
   * @notice See {ILendingProvider}
   */
  function withdraw(address asset, uint256 amount) external override returns (bool success) {
    address zap = _getBeefyZap();
    address beefyVault = _getBeefyVault();

    uint256 totalBalance = IBeefyVaultV6(beefyVault).balanceOf(address(this));
    console.log("totalBalance", totalBalance);

    uint256 depositBalance = _getDepositBalance(asset, address(this));
    uint256 toWithdraw = amount * totalBalance / depositBalance;
    console.log("toWithdraw", toWithdraw);

    (, uint256 swapAmountOut,) = IBeefyUniV2ZapSolidly(zap).estimateSwap(beefyVault, asset, amount);

    _outAndSwap(toWithdraw, asset, swapAmountOut);

    return true;
  }

  function _outAndSwap(uint256 withdrawAmount, address desiredToken, uint256 desiredTokenOutMin)
    internal
  {
    IBeefyVaultV6 vault = IBeefyVaultV6(_getBeefyVault());
    IUniswapV2Pair pair = IUniswapV2Pair(vault.want());

    address token0 = pair.token0();
    address token1 = pair.token1();
    require(
      token0 == desiredToken || token1 == desiredToken,
      "Beefy: desired token not present in liqudity pair"
    );

    vault.withdraw(withdrawAmount);
    // remove liquidity
    IERC20(pair).safeTransfer(address(pair), IERC20(pair).balanceOf(address(this)));
    IUniswapV2Pair(pair).burn(address(this));

    address swapToken = token1 == desiredToken ? token0 : token1;
    address[] memory path = new address[](2);
    path[0] = swapToken;
    path[1] = desiredToken;

    address router = _getSolidlyRouter();
    _approveTokenIfNeeded(path[0], router);
    ISolidlyRouter(router).swapExactTokensForTokensSimple(
      IERC20(swapToken).balanceOf(address(this)),
      desiredTokenOutMin,
      path[0],
      path[1],
      pair.stable(),
      address(this),
      block.timestamp
    );
  }

  function _approveTokenIfNeeded(address token, address spender) private {
    if (IERC20(token).allowance(address(this), spender) == 0) {
      IERC20(token).safeApprove(spender, type(uint256).max);
    }
  }

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
    balance = _getDepositBalance(asset, user);
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

  function _getDepositBalance(address asset, address user) internal view returns (uint256 balance) {
    IBeefyVaultV6 beefyVault = IBeefyVaultV6(_getBeefyVault());
    IUniswapV2Pair pair = IUniswapV2Pair(beefyVault.want());
    ISolidlyRouter router = ISolidlyRouter(_getSolidlyRouter());
    // LP token per shares
    // beefy shares balance (LP)
    balance = beefyVault.balanceOf(user) * beefyVault.getPricePerFullShare() / 1e18;
    // decompose the LP
    (uint256 amountA, uint256 amountB) =
      router.quoteRemoveLiquidity(asset, pair.token1(), pair.stable(), balance);
    // get the price of token1 in WETH
    return pair.getAmountOut(amountB, pair.token1()) + amountA;
  }
}
