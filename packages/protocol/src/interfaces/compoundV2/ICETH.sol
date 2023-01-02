// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {ICToken} from "./ICToken.sol";

interface ICETH is ICToken {
  function mint() external payable;

  function repayBorrow() external payable;
}
