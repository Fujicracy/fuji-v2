// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IBeefyVaultV6} from "../../interfaces/beefy/IBeefyVaultV6.sol";
import {IBeefyUniV2ZapVelodrome} from "../../interfaces/beefy/IBeefyUniV2ZapVelodrome.sol";
import {IVelodromePair} from "../../interfaces/velodrome/IVelodromePair.sol";
import {IVelodromeRouter} from "../../interfaces/velodrome/IVelodromeRouter.sol";

/**
 * @title Beefy Velodrome sETH-ETH Optimism Lending Provider
 * @author fujidao Labs
 * @notice This contract allows interaction with this specific vault.
 */
contract BeefyVelodromesETHETH is ILendingProvider {
  // Custom errors
  error BeefyVelodromesETHETHOptimism__notImplemented();
  error BeefyVelodromesETHETHOptimism__notApplicable();

  using SafeERC20 for IERC20;
  using Math for uint256;

  /// inheritdoc ILendingProvider
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

  /// inheritdoc ILendingProvider
  function approvedOperator(
    address,
    address,
    address
  )
    external
    pure
    override
    returns (address operator)
  {
    operator = address(_getBeefyZap());
  }

  /// inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    IBeefyUniV2ZapVelodrome zap = _getBeefyZap();
    IBeefyVaultV6 beefyVault = _getBeefyVault();
    address asset = vault.asset();

    (, uint256 amountOut,) = zap.estimateSwap(address(beefyVault), asset, amount);

    zap.beefIn(address(beefyVault), amountOut, asset, amount);

    return true;
  }

  /// inheritdoc ILendingProvider
  function borrow(uint256, IVault) external pure override returns (bool) {
    revert BeefyVelodromesETHETHOptimism__notApplicable();
  }

  /// inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    IBeefyUniV2ZapVelodrome zap = _getBeefyZap();
    IBeefyVaultV6 beefyVault = _getBeefyVault();
    address asset = vault.asset();

    uint256 totalBalance = beefyVault.balanceOf(address(vault));

    uint256 depositBalance = _getDepositBalance(asset, address(vault));
    uint256 toWithdraw = amount * totalBalance / depositBalance;

    (, uint256 amountOut,) = zap.estimateSwap(address(beefyVault), asset, amount);

    // allow up to 1% slippage
    _removeLiquidityAndSwap(toWithdraw, asset, amountOut.mulDiv(99, 100));

    return true;
  }

  /// inheritdoc ILendingProvider
  function payback(uint256, IVault) external pure override returns (bool) {
    revert BeefyVelodromesETHETHOptimism__notApplicable();
  }

  /// inheritdoc ILendingProvider
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

  /// inheritdoc ILendingProvider
  function getDepositRateFor(IVault) external pure override returns (uint256) {
    revert BeefyVelodromesETHETHOptimism__notImplemented();
  }

  /// inheritdoc ILendingProvider
  function getBorrowRateFor(IVault) external pure override returns (uint256) {
    revert BeefyVelodromesETHETHOptimism__notApplicable();
  }

  /// inheritdoc ILendingProvider
  function getDepositBalance(
    address user,
    IVault vault
  )
    external
    view
    override
    returns (uint256 balance)
  {
    balance = _getDepositBalance(vault.asset(), user);
  }

  /// inheritdoc ILendingProvider
  function getBorrowBalance(address, IVault) external pure override returns (uint256) {
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
