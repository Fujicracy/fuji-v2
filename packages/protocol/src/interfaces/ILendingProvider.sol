// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

/**
 * @title Lending provider interface.
 * @author fujidao Labs
 * @notice  Defines the interface for core engine to perform operations at lending providers.
 */
interface ILendingProvider {
  /**
   * @notice Returns the operator address that requires ERC20-approval for deposits.
   * @param asset address.
   */
  function approvedOperator(address asset) external returns (address operator);

  /**
   * @notice Performs deposit operation at lending provider on behalf caller.
   * @param asset address.
   * @param amount amount integer.
   */
  function deposit(address asset, uint256 amount) external returns (bool success);

  /**
   * @notice Performs borrow operation at lending provider on behalf caller.
   * @param asset address.
   * @param amount amount integer.
   */
  function borrow(address asset, uint256 amount) external returns (bool success);

  /**
   * @notice Performs withdraw operation at lending provider on behalf caller.
   * @param asset address.
   * @param amount amount integer.
   */
  function withdraw(address asset, uint256 amount) external returns (bool success);

  /**
   * @notice Performs payback operation at lending provider on behalf caller.
   * @param asset address.
   * @param amount amount integer.
   * @dev Check erc20-approval to lending provider prior to call.
   */
  function payback(address asset, uint256 amount) external returns (bool success);

  /**
   * @notice Returns the latest SUPPLY annual percent rate (APR) at lending provider.
   * @param asset address.
   * @dev Should return the rate in ray units (1e27)
   * Example 8.5% APR = 0.085 x 1e27 = 85000000000000000000000000
   */
  function getDepositRateFor(address asset) external view returns (uint256 rate);

  /**
   * @notice Returns the latest BORROW annual percent rate (APR) at lending provider.
   * @param asset address.
   * @dev Should return the rate in ray units (1e27)
   * Example 8.5% APR = 0.085 x 1e27 = 85000000000000000000000000
   */
  function getBorrowRateFor(address asset) external view returns (uint256 rate);

  /**
   * @notice Returns DEPOSIT balance of 'user' at lending provider.
   * @param asset address.
   * @param user address whom balance is needed.
   */
  function getDepositBalance(address asset, address user) external view returns (uint256 balance);

  /**
   * @notice Returns BORROW balance of 'user' at lending provider.
   * @param asset address.
   * @param user address whom balance is needed.
   */
  function getBorrowBalance(address asset, address user) external view returns (uint256 balance);
}
