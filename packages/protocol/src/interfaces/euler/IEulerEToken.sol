// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title IEulerEToken
 *
 * @author Euler
 *
 * @notice Interface to interact with Euler receipt
 * tokens.
 */

interface IEulerEToken {
  function underlyingAsset() external view returns (address);

  function balanceOf(address account) external view returns (uint256);

  function balanceOfUnderlying(address account) external view returns (uint256);

  function deposit(uint256 subAccountId, uint256 amount) external;

  function withdraw(uint256 subAccountId, uint256 amount) external;

  function approve(address spender, uint256 amount) external returns (bool);

  function transfer(address to, uint256 amount) external returns (bool);
}
