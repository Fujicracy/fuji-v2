// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

interface IRouter {
  enum Action {
    Deposit,
    Withdraw,
    Borrow,
    Payback,
    XTransfer,
    XTransferWithCall
  }

  function xBundle(Action[] memory actions, bytes[] memory args) external;

  function onXCall(bytes memory params) external;
}
