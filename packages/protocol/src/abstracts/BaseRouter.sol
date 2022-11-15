// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title Abstract contract for all routers.
 * @author Fujidao Labs
 * @notice Defines the interface and common functions for all routers.
 */

import {IRouter} from "../interfaces/IRouter.sol";
import {ISwapper} from "../interfaces/ISwapper.sol";
import {IVault} from "../interfaces/IVault.sol";
import {IChief} from "../interfaces/IChief.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";
import {IVaultPermissions} from "../interfaces/IVaultPermissions.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SystemAccessControl} from "../access/SystemAccessControl.sol";
import {PeripheryPayments, IWETH9, ERC20} from "../helpers/PeripheryPayments.sol";

abstract contract BaseRouter is PeripheryPayments, SystemAccessControl, IRouter {
  struct BalanceChecker {
    address token;
    uint256 balance;
  }

  error BaseRouter__bundleInternal_wrongInput();
  error BaseRouter__bundleInternal_noRemnantBalance();

  BalanceChecker[] private _tokensToCheck;

  constructor(
    IWETH9 weth,
    IChief chief
  )
    PeripheryPayments(weth)
    SystemAccessControl(address(chief))
  {}

  function xBundle(Action[] memory actions, bytes[] memory args) external override {
    // add auth?
    // msg.sender == ??
    _bundleInternal(actions, args);
  }

  /**
   * @dev executes a bundle of actions.
   *
   * Requirements:
   * - MUST not leave any balance in this contract after all actions.
   */
  function _bundleInternal(Action[] memory actions, bytes[] memory args) internal {
    if (actions.length != args.length) {
      revert BaseRouter__bundleInternal_wrongInput();
    }

    uint256 len = actions.length;
    for (uint256 i = 0; i < len;) {
      if (actions[i] == Action.Deposit) {
        // DEPOSIT
        (IVault vault, uint256 amount, address receiver, address sender) =
          abi.decode(args[i], (IVault, uint256, address, address));

        // this check is needed because when we bundle mulptiple actions
        // it can happen the router already holds the assets in question;
        // for. example when we withdraw from a vault and deposit to another one
        if (sender != address(this)) {
          pullTokenFrom(ERC20(vault.asset()), amount, address(this), sender);
        }
        approve(ERC20(vault.asset()), address(vault), amount);
        vault.deposit(amount, receiver);
      } else if (actions[i] == Action.Withdraw) {
        // WITHDRAW
        (IVault vault, uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (IVault, uint256, address, address));

        // Check balance of `asset` before execution at vault.
        _addTokenToCheck(vault.asset());

        vault.withdraw(amount, receiver, owner);
      } else if (actions[i] == Action.Borrow) {
        // BORROW
        (IVault vault, uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (IVault, uint256, address, address));

        // Check balance of `debtAsset` before execution at vault.
        _addTokenToCheck(vault.debtAsset());

        vault.borrow(amount, receiver, owner);
      } else if (actions[i] == Action.Payback) {
        // PAYBACK
        (IVault vault, uint256 amount, address receiver, address sender) =
          abi.decode(args[i], (IVault, uint256, address, address));

        if (sender != address(this)) {
          pullTokenFrom(ERC20(vault.debtAsset()), amount, address(this), sender);
        }
        approve(ERC20(vault.debtAsset()), address(vault), amount);
        vault.payback(amount, receiver);
      } else if (actions[i] == Action.PermitWithdraw) {
        // PERMIT ASSETS
        (
          IVaultPermissions vault,
          address owner,
          address receiver,
          uint256 amount,
          uint256 deadline,
          uint8 v,
          bytes32 r,
          bytes32 s
        ) = abi.decode(
          args[i], (IVaultPermissions, address, address, uint256, uint256, uint8, bytes32, bytes32)
        );
        vault.permitWithdraw(owner, receiver, amount, deadline, v, r, s);
      } else if (actions[i] == Action.PermitBorrow) {
        // PERMIT BORROW
        (
          IVaultPermissions vault,
          address owner,
          address receiver,
          uint256 amount,
          uint256 deadline,
          uint8 v,
          bytes32 r,
          bytes32 s
        ) = abi.decode(
          args[i], (IVaultPermissions, address, address, uint256, uint256, uint8, bytes32, bytes32)
        );

        vault.permitBorrow(owner, receiver, amount, deadline, v, r, s);
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

        _addTokenToCheck(assetOut);

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
    _checkNoRemnantBalance(_tokensToCheck);
    _checkNoNativeBalance();
  }

  function _crossTransfer(bytes memory) internal virtual;

  function _crossTransferWithCalldata(bytes memory) internal virtual;

  function _addTokenToCheck(address token) private {
    BalanceChecker memory checkedToken =
      BalanceChecker(token, IERC20(token).balanceOf(address(this)));
    _tokensToCheck.push(checkedToken);
  }

  function _checkNoRemnantBalance(BalanceChecker[] memory tokensToCheck) private {
    uint256 tlenght = tokensToCheck.length;
    for (uint256 i = 0; i < tlenght;) {
      uint256 previousBalance = tokensToCheck[i].balance;
      uint256 currentBalance = IERC20(tokensToCheck[i].token).balanceOf(address(this));
      if (currentBalance > previousBalance) {
        revert BaseRouter__bundleInternal_noRemnantBalance();
      }
      unchecked {
        ++i;
      }
    }
    delete _tokensToCheck;
  }

  function _checkNoNativeBalance() private view {
    if (address(this).balance > 0) {
      revert BaseRouter__bundleInternal_noRemnantBalance();
    }
  }
}
