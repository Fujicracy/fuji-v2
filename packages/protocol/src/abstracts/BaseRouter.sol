// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

/**
 * @title Abstract contract for all routers.
 * @author Fujidao Labs
 * @notice Defines the interface and common functions for all routers.
 */

import {IRouter} from "../interfaces/IRouter.sol";
import {IVault} from "../interfaces/IVault.sol";
import {PeripheryPayments, IWETH9, ERC20} from "../helpers/PeripheryPayments.sol";

abstract contract BaseRouter is PeripheryPayments, IRouter {
  constructor(IWETH9 weth) PeripheryPayments(weth) {}

  // TODO nonReentrant
  function xBundle(Action[] memory actions, bytes[] memory args) external override {
    _bundleInternal(actions, args);
  }

  function _bundleInternal(Action[] memory actions, bytes[] memory args) internal {
    uint256 len = actions.length;
    for (uint256 i = 0; i < len;) {
      if (actions[i] == Action.Deposit) {
        // DEPOSIT
        (address vaultAddr, uint256 amount, address receiver) =
          abi.decode(args[i], (address, uint256, address));
        IVault vault = IVault(vaultAddr);

        pullToken(ERC20(vault.asset()), amount, address(this));
        vault.deposit(amount, receiver);
      } else if (actions[i] == Action.Withdraw) {
        // WITHDRAW
        (address vaultAddr, uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (address, uint256, address, address));
        IVault vault = IVault(vaultAddr);

        vault.withdraw(amount, receiver, owner);
      } else if (actions[i] == Action.Borrow) {
        // BORROW
        (address vaultAddr, uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (address, uint256, address, address));
        IVault vault = IVault(vaultAddr);

        vault.borrow(amount, receiver, owner);
      } else if (actions[i] == Action.Payback) {
        // PAYBACK
        (address vaultAddr, uint256 amount, address receiver) =
          abi.decode(args[i], (address, uint256, address));
        IVault vault = IVault(vaultAddr);

        pullToken(ERC20(vault.debtAsset()), amount, address(this));
        vault.payback(amount, receiver);
      } else if (actions[i] == Action.XTransfer) {
        // SIMPLE BRIDGE TRANSFER

        _crossTransfer(args[i]);
      } else if (actions[i] == Action.XTransferWithCall) {
        // BRIDGE WITH CALLDATA

        _crossTransferWithCalldata(args[i]);
      }
      unchecked {
        ++i;
      }
    }
  }

  function _crossTransfer(bytes memory) internal virtual;

  function _crossTransferWithCalldata(bytes memory) internal virtual;
}
