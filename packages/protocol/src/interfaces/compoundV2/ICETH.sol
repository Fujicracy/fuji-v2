// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {ICToken} from "./ICToken.sol";

/**
 * @title ICETH
 * @author Compound
 */
interface ICETH is ICToken {
  /**
   * @notice Sender supplies assets into the market and receives cTokens in exchange
   * @dev Reverts upon any failure
   */
  function mint() external payable;

  /**
   * @notice Sender repays their own borrow
   * @dev Reverts upon any failure
   */
  function repayBorrow() external payable;
}
