// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IBeefyVaultV6} from "../../interfaces/beefy/IBeefyVaultV6.sol";
import {IBeefyUniV2ZapVelodrome} from "../../interfaces/beefy/IBeefyUniV2ZapVelodrome.sol";
import {IVelodromePair} from "../../interfaces/velodrome/IVelodromePair.sol";
import {IVelodromeRouter} from "../../interfaces/velodrome/IVelodromeRouter.sol";

/**
 * @title Beefy Velodrome sETH-ETH Optimism Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with this specific vault.
 */
contract BeefyVelodromesETHETHOptimism is ILendingProvider {
  error BeefyVelodromesETHETHOptimism__notImplemented();
  error BeefyVelodromesETHETHOptimism__notApplicable();

  using SafeERC20 for IERC20;
  using Math for uint256;

  function providerName() public pure override returns (string memory) {
    return "Beefy_V6_ETH";
  }

  function _getBeefyVault() internal pure returns (IBeefyVaultV6) {
    return IBeefyVaultV6(0xf92129fE0923d766C2540796d4eA31Ff9FF65522);
  }

  function _getBeefyZap() internal pure returns (IBeefyUniV2ZapVelodrome) {
    return IBeefyUniV2ZapVelodrome(0x9b50B06B81f033ca86D70F0a44F30BD7E0155737);
  }

  function _getVelodromePair() internal pure returns (IVelodromePair) {
    return IVelodromePair(0xFd7FddFc0A729eCF45fB6B12fA3B71A575E1966F);
  }

  function _getVelodromeRouter() internal pure returns (IVelodromeRouter) {
    return IVelodromeRouter(0xa132DAB612dB5cB9fC9Ac426A0Cc215A3423F9c9);
  }

  /**
   * @notice See {ILendingProvider}
   */
  function approvedOperator(address, address) external pure override returns (address operator) {
    operator = address(_getBeefyZap());
  }

  /**
   * @notice See {ILendingProvider}
   */
  function deposit(address asset, uint256 amount, address vault)
    external
    override
    returns (bool success)
  {
    vault;
    IBeefyUniV2ZapVelodrome zap = _getBeefyZap();
    IBeefyVaultV6 beefyVault = _getBeefyVault();

    (, uint256 amountOut,) = zap.estimateSwap(address(beefyVault), asset, amount);

    zap.beefIn(address(beefyVault), amountOut, asset, amount);

    return true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function borrow(address, uint256, address) external pure override returns (bool) {
    revert BeefyVelodromesETHETHOptimism__notApplicable();
  }

  /**
   * @notice See {ILendingProvider}
   * @dev We can use Beefy Zap as in deposit because 'zap.beefOutAndSwap(...)'
   * returns ETH instead of WETH.
   */
  function withdraw(address asset, uint256 amount, address vault)
    external
    override
    returns (bool success)
  {
    IBeefyUniV2ZapVelodrome zap = _getBeefyZap();
    IBeefyVaultV6 beefyVault = _getBeefyVault();

    uint256 totalBalance = beefyVault.balanceOf(address(vault));

    uint256 depositBalance = _getDepositBalance(asset, address(vault));
    uint256 toWithdraw = amount * totalBalance / depositBalance;

    (, uint256 amountOut,) = zap.estimateSwap(address(beefyVault), asset, amount);

    // allow up to 1% slippage
    _removeLiquidityAndSwap(toWithdraw, asset, amountOut.mulDiv(99, 100));

    return true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function payback(address, uint256, address) external pure override returns (bool) {
    revert BeefyVelodromesETHETHOptimism__notApplicable();
  }

  /**
   * @notice See {ILendingProvider}
   */
  function _removeLiquidityAndSwap(
    uint256 withdrawAmount,
    address desiredToken,
    uint256 desiredOutMin
  )
    internal
  {
    IBeefyVaultV6 vault = IBeefyVaultV6(_getBeefyVault());
    IVelodromePair pair = _getVelodromePair();

    vault.withdraw(withdrawAmount);

    address token0 = pair.token0();
    address token1 = pair.token1();

    // remove liquidity
    IERC20(pair).safeTransfer(address(pair), pair.balanceOf(address(this)));
    pair.burn(address(this));

    address swapToken = token1 == desiredToken ? token0 : token1;
    address[] memory path = new address[](2);
    path[0] = swapToken;
    path[1] = desiredToken;

    IVelodromeRouter router = _getVelodromeRouter();
    if (IERC20(path[0]).allowance(address(this), address(router)) == 0) {
      IERC20(path[0]).safeApprove(address(router), type(uint256).max);
    }
    router.swapExactTokensForTokensSimple(
      IERC20(swapToken).balanceOf(address(this)),
      desiredOutMin,
      path[0],
      path[1],
      true,
      address(this),
      block.timestamp
    );
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositRateFor(address, address) external pure override returns (uint256) {
    revert BeefyVelodromesETHETHOptimism__notImplemented();
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowRateFor(address, address) external pure override returns (uint256) {
    revert BeefyVelodromesETHETHOptimism__notApplicable();
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositBalance(address asset, address user, address)
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
  function getBorrowBalance(address, address, address) external pure override returns (uint256) {
    revert BeefyVelodromesETHETHOptimism__notApplicable();
  }

  function _getDepositBalance(address asset, address user) internal view returns (uint256 balance) {
    IVelodromeRouter router = _getVelodromeRouter();
    IBeefyVaultV6 beefyVault = _getBeefyVault();
    IVelodromePair pair = _getVelodromePair();

    // LP token per shares
    // beefy shares balance (LP)
    balance = beefyVault.balanceOf(user) * beefyVault.getPricePerFullShare() / 1e18;
    // decompose the LP
    address token0 = pair.token0();
    address token1 = pair.token1();

    (uint256 amountA, uint256 amountB) = router.quoteRemoveLiquidity(token0, token1, true, balance);

    // get the price of token1 in WETH
    if (token0 == asset) {
      balance = pair.getAmountOut(amountB, token1) + amountA;
    } else {
      balance = pair.getAmountOut(amountA, token0) + amountB;
    }
  }
}
