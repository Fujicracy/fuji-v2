// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IBeefyVaultV6} from "../../interfaces/beefy/IBeefyVaultV6.sol";
import {IBeefyUniV2ZapSolidly} from "../../interfaces/beefy/IBeefyUniV2ZapSolidly.sol";

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
    uint256 minAmountOut = swapAmountOut.mulDiv(99, 100);
    IBeefyUniV2ZapSolidly(zap).beefIn(beefyVault, minAmountOut, asset, amount);

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

    uint256 toWithdraw = amount * 1e18 / IBeefyVaultV6(beefyVault).getPricePerFullShare();
    uint256 totalBalance = IBeefyVaultV6(beefyVault).balanceOf(address(this));
    IERC20(beefyVault).safeApprove(zap, toWithdraw);

    console.log(toWithdraw);
    console.log(totalBalance);

    (, uint256 swapAmountOut,) = IBeefyUniV2ZapSolidly(zap).estimateSwap(beefyVault, asset, 5e17);
    // allow up to 1% slippage
    uint256 minAmountOut = swapAmountOut.mulDiv(99, 100);
    IBeefyUniV2ZapSolidly(zap).beefOutAndSwap(beefyVault, toWithdraw, asset, minAmountOut);

    return true;
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
    asset;
    IBeefyVaultV6 beefyVault = IBeefyVaultV6(_getBeefyVault());
    balance = beefyVault.balanceOf(user) * beefyVault.getPricePerFullShare() / 1e18;
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
}
