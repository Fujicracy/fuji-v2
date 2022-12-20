// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IGenIToken} from "./IGenIToken.sol";

interface IIETH is IGenIToken {
  function mint(address _recipient) external payable;

  function mintForSelfAndEnterMarket() external payable;

  function repayBorrow() external payable;

  function repayBorrowBehalf(address _borrower) external payable;
}
