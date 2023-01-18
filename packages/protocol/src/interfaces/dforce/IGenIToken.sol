// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IGenIToken is IERC20 {
  function redeem(address from, uint256 redeemTokens) external;

  function redeemUnderlying(address _from, uint256 _redeemUnderlying) external;

  function borrow(uint256 _borrowAmount) external;

  function exchangeRateStored() external view returns (uint256);

  function borrowRatePerBlock() external view returns (uint256);

  function supplyRatePerBlock() external view returns (uint256);

  function borrowBalanceStored(address user) external view returns (uint256);

  function totalBorrows() external view returns (uint256);

  function borrowIndex() external view returns (uint256);

  function getCash() external view returns (uint256);

  function accrualBlockNumber() external view returns (uint256);

  function totalReserves() external view returns (uint256);

  function reserveRatio() external view returns (uint256);

  function borrowBalanceCurrent(address user) external returns (uint256);
}
