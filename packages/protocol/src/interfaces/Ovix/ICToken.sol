// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/**
 * @title ICToken
 * @author 0vix
 */
interface ICToken is IERC20 {
  function accrualBlockTimestamp() external view returns (uint256);

  function getCash() external view returns (uint256);

  function totalBorrows() external view returns (uint256);

  function totalReserves() external view returns (uint256);

  function redeemUnderlying(uint256) external returns (uint256);

  function borrow(uint256 amount) external returns (uint256);

  function exchangeRateStored() external view returns (uint256);

  function borrowRatePerTimestamp() external view returns (uint256);

  function supplyRatePerTimestamp() external view returns (uint256);

  function borrowIndex() external view returns (uint256);

  function borrowBalanceStored(address account) external view returns (uint256);

  function borrowBalanceCurrent(address account) external returns (uint256);

  function reserveFactorMantissa() external view returns (uint256);
}
