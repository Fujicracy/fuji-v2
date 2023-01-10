// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IGenIToken} from "./IGenIToken.sol";

interface IIERC20 is IGenIToken {
  function mint(address _recipient, uint256 _mintAmount) external;

  function mintForSelfAndEnterMarket(uint256 _mintAmount) external;

  function repayBorrow(uint256 _repayAmount) external;

  function repayBorrowBehalf(address _borrower, uint256 _repayAmount) external;
}
