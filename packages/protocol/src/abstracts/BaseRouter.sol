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

//
// TODO inherit from SelfPermit, Multicall
// for additional functionalitites
// ref: https://github.com/fei-protocol/ERC4626/blob/main/src/ERC4626RouterBase.sol

abstract contract BaseRouter is PeripheryPayments, IRouter {
  constructor(IWETH9 weth) PeripheryPayments(weth) {}

  // TODO nonReentrant
  function bundle(Action[] memory actions, bytes[] memory args) external override {
    uint256 len = actions.length;
    for (uint256 i = 0; i < len; i++) {
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
      } else if (actions[i] == Action.BridgeTransfer) {
        // BRIDGE TRANSFER

        _bridgeTransfer(args[i]);
      }
    }
  }

  function _bridgeTransfer(bytes memory) internal virtual;

  function _bridgeTransferWithCalldata(bytes memory) internal virtual;
}
