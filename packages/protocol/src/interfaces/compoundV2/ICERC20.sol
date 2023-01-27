// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {ICToken} from "./ICToken.sol";

/**
 * @title ICERC20
 * @author Compound
 */
interface ICERC20 is ICToken {
  function mint(uint256 amount) external returns (uint256);

  function repayBorrow(uint256 amount) external returns (uint256);
}
