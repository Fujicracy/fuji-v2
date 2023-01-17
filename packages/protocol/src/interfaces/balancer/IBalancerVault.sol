// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IFlashLoanRecipient} from "./IFlashLoanRecipient.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/**
 * @dev Partial interface for the vault, only for flash loans
 */
interface IBalancerVault {
  // Flash Loans

  /**
   * @dev Performs a 'flash loan', sending tokens to `recipient`, executing the `receiveFlashLoan` hook on it,
   * and then reverting unless the tokens plus a proportional protocol fee have been returned.
   *
   * The `tokens` and `amounts` arrays must have the same length, and each entry in these indicates the loan amount
   * for each token contract. `tokens` must be sorted in ascending order.
   *
   * The 'userData' field is ignored by the Vault, and forwarded as-is to `recipient` as part of the
   * `receiveFlashLoan` call.
   *
   * Emits `FlashLoan` events.
   */
  function flashLoan(
    IFlashLoanRecipient recipient,
    IERC20[] memory tokens,
    uint256[] memory amounts,
    bytes memory userData
  )
    external;

  /**
   * @dev Emitted for each individual flash loan performed by `flashLoan`.
   */
  event FlashLoan(
    IFlashLoanRecipient indexed recipient, IERC20 indexed token, uint256 amount, uint256 feeAmount
  );
}
