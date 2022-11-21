// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Router Interface.
 * @author Fujidao Labs
 * @notice Defines the interface for router operations.
 */

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

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
    XTransferWithCall,
    DepositETH,
    WithdrawETH
  }

  function xBundle(Action[] memory actions, bytes[] memory args) external payable;

  function sweepToken(ERC20 token, address receiver) external;

  function sweepETH(address receiver) external;
}
