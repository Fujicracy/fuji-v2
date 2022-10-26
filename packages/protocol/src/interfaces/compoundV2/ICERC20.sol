// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import {ICToken} from "./ICToken.sol";

interface ICERC20 is ICToken {
  function mint(uint256 amount) external returns (uint256);

  function repayBorrow(uint256 amount) external returns (uint256);
}
