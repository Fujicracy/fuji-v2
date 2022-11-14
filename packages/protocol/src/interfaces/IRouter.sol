// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Router Interface.
 * @author Fujidao Labs
 * @notice Defines the interface for router operations.
 */

interface IRouter {
  enum Action {
    Deposit,
    Withdraw,
    Borrow,
    Payback,
    Flashloan,
    Swap,
    PermitWithdraw,
    PermitBorrow,
    XTransfer,
    XTransferWithCall
  }

  function xBundle(Action[] memory actions, bytes[] memory args) external;
}
