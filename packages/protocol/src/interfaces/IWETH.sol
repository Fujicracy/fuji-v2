// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title IWETH9
 *
 * @author Unknown
 *
 * @notice Interface of typical ERC20 wrapped native token.
 */

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IWETH is IERC20 {
  function deposit() external payable;

  function withdraw(uint256) external;
}
