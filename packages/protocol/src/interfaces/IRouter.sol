// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Router Interface
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

  /**
   * @notice An entry-point function that executes encoded commands along with provided inputs.
   *
   * @param actions An array of actions that will be executed in a row.
   * @param args An array of encoded inputs needed to execute each action.
   */
  function xBundle(Action[] memory actions, bytes[] memory args) external payable;

  /**
   * @notice Sweeps accidental ERC-20 transfers to this contract or stuck funds due to failed
   * cross-chain calls (cf. ConnextRouter).
   * @param token The address of the ERC-20 token to sweep.
   * @param receiver The address that will receive the swept funds.
   */
  function sweepToken(ERC20 token, address receiver) external;

  /**
   * @notice Sweeps accidental ETH transfers to this contract.
   * @param receiver The address that will receive the swept funds.
   */
  function sweepETH(address receiver) external;
}
