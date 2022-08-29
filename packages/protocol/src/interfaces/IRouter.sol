// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

interface IRouter {
  enum Action {
    Deposit,
    Withdraw,
    Borrow,
    Payback,
    Flashloan,
    Swap,
    PermitAssets,
    PermitBorrow,
    XTransfer,
    XTransferWithCall
  }

  function xBundle(Action[] memory actions, bytes[] memory args) external;

  function inboundXCall(bytes memory params) external;
}
