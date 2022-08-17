// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

/**
 * @title Abstract contract for all routers.
 * @author Fujidao Labs
 * @notice Defines the interface and common functions for all routers.
 */

import {IRouter} from "../interfaces/IRouter.sol";
import {ISwapper} from "../interfaces/ISwapper.sol";
import {IVault} from "../interfaces/IVault.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";
import {PeripheryPayments, IWETH9, ERC20} from "../helpers/PeripheryPayments.sol";

abstract contract BaseRouter is PeripheryPayments, IRouter {
  constructor(IWETH9 weth) PeripheryPayments(weth) {}

  function xBundle(Action[] memory actions, bytes[] memory args) external override {
    _bundleInternal(actions, args);
  }

  function _bundleInternal(Action[] memory actions, bytes[] memory args) internal {
    uint256 len = actions.length;
    for (uint256 i = 0; i < len;) {
      if (actions[i] == Action.Deposit) {
        // DEPOSIT
        (IVault vault, uint256 amount, address receiver, address sender) =
          abi.decode(args[i], (IVault, uint256, address, address));

        // this check is needed because when we bundle mulptiple actions
        // it can happen the router already holds the assets in question;
        // for. example when we withdraw from a vault and deposit to another one
        if (sender != address(this)) pullTokenFrom(
          ERC20(vault.asset()), amount, address(this), sender
        );
        approve(ERC20(vault.asset()), address(vault), amount);
        vault.deposit(amount, receiver);
      } else if (actions[i] == Action.Withdraw) {
        // WITHDRAW
        (IVault vault, uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (IVault, uint256, address, address));

        vault.withdraw(amount, receiver, owner);
      } else if (actions[i] == Action.Borrow) {
        // BORROW
        (IVault vault, uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (IVault, uint256, address, address));

        vault.borrow(amount, receiver, owner);
      } else if (actions[i] == Action.Payback) {
        // PAYBACK
        (IVault vault, uint256 amount, address receiver, address sender) =
          abi.decode(args[i], (IVault, uint256, address, address));

        if (sender != address(this)) pullTokenFrom(
          ERC20(vault.debtAsset()), amount, address(this), sender
        );
        approve(ERC20(vault.debtAsset()), address(vault), amount);
        vault.payback(amount, receiver);
      } else if (actions[i] == Action.XTransfer) {
        // SIMPLE BRIDGE TRANSFER

        _crossTransfer(args[i]);
      } else if (actions[i] == Action.XTransferWithCall) {
        // BRIDGE WITH CALLDATA

        _crossTransferWithCalldata(args[i]);
      } else if (actions[i] == Action.Swap) {
        // SWAP
        (
          ISwapper swapper,
          address assetIn,
          address assetOut,
          uint256 maxAmountIn,
          uint256 amountOut,
          address receiver,
          uint256 slippage
        ) = abi.decode(args[i], (ISwapper, address, address, uint256, uint256, address, uint256));

        approve(ERC20(assetIn), address(swapper), maxAmountIn);

        // pull tokens and swap
        swapper.swap(assetIn, assetOut, amountOut, receiver, slippage);
      } else if (actions[i] == Action.Flashloan) {
        // FLASHLOAN

        // Decode params
        (IFlasher flasher, IFlasher.FlashloanParams memory flParams, uint8 providerId) =
          abi.decode(args[i], (IFlasher, IFlasher.FlashloanParams, uint8));

        // Call Flasher
        flasher.initiateFlashloan(flParams, providerId);
      }
      unchecked {
        ++i;
      }
    }
  }

  function _crossTransfer(bytes memory) internal virtual;

  function _crossTransferWithCalldata(bytes memory) internal virtual;
}
