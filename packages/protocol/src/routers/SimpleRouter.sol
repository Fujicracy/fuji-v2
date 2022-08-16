// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

/**
 * @title SimpleRouter.
 * @author Fujidao Labs
 * @notice A Router contract without any bridging logic.
 * It facilitates tx bundling meant to be executed on a single chain.
 */

import {IUniswapV2Router01} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import {BaseRouter} from "../abstracts/BaseRouter.sol";
import {IWETH9, ERC20} from "../helpers/PeripheryPayments.sol";
import {IVault} from "../interfaces/IVault.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";

contract SimpleRouter is BaseRouter {
  error SimpleRouter__noCrossTransfersImplemented();

  IFlasher public flasher;
  IUniswapV2Router01 public swapper;

  constructor(IWETH9 weth, IFlasher _flasher, IUniswapV2Router01 _swapper) BaseRouter(weth) {
    flasher = _flasher;
    swapper = _swapper;
  }

  function inboundXCall(bytes memory params) external pure {
    params;
    revert SimpleRouter__noCrossTransfersImplemented();
  }

  function _crossTransfer(bytes memory params) internal pure override {
    params;
    revert SimpleRouter__noCrossTransfersImplemented();
  }

  function _crossTransferWithCalldata(bytes memory params) internal pure override {
    params;
    revert SimpleRouter__noCrossTransfersImplemented();
  }

  function _initiateFlashloan(bytes memory params) internal override {
    // Decode params
    (IFlasher.FlashloanParams memory flParams, uint8 providerId) =
      abi.decode(params, (IFlasher.FlashloanParams, uint8));

    // Call Flasher
    flasher.initiateFlashloan(flParams, providerId);
  }

  function _paybackFlashloan(bytes memory params) internal override {
    // Decode params
    // amountOut = amount + fee
    (address assetIn, address assetOut, uint256 amountOut, uint256 slippage) =
      abi.decode(params, (address, address, uint256, uint256));

    // swap asset to repay flashloan
    _swap(assetIn, assetOut, amountOut, slippage);
  }

  function setFlasher(IFlasher newFlasher) external {
    // TODO onlyOwner
    flasher = newFlasher;
  }

  function setSwapper(IUniswapV2Router01 newSwapper) external {
    // TODO onlyOwner
    swapper = newSwapper;
  }

  // TODO replace this with safeIncreaseAllowance in xBundle
  function registerVault(IVault vault) external {
    // TODO onlyOwner
    address asset = vault.asset();
    approve(ERC20(asset), address(vault), type(uint256).max);

    address debtAsset = vault.debtAsset();
    approve(ERC20(debtAsset), address(vault), type(uint256).max);
  }

  function _swap(address assetIn, address assetOut, uint256 amountOut, uint256 slippage) internal {
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

    uint256[] memory amounts = swapper.getAmountsIn(amountOut, path);
    slippage;
    // TODO check for slippage with value from oracle

    approve(ERC20(assetIn), address(swapper), amounts[0]);
    // swap and transfer swapped amount to Flasher
    swapper.swapTokensForExactTokens(
      amountOut,
      amounts[0],
      path,
      address(flasher),
      // solhint-disable-next-line
      block.timestamp
    );
  }
}
