// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title IEulerDToken
 * @author Euler
 */
interface IEulerDToken {
  function underlyingAsset() external view returns (address);

  function balanceOf(address account) external view returns (uint256);

  function borrow(uint256 subAccountId, uint256 amount) external;

  function repay(uint256 subAccountId, uint256 amount) external;

  function flashLoan(uint256 amount, bytes calldata data) external;
}
