// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Lending provider interface.
 * @author fujidao Labs
 * @notice  Defines the interface for core engine to perform operations at lending providers.
 * @dev Functions are intended to be called in the context of a Vault via delegateCall,
 * except indicated.
 */

interface ILendingProvider {
  function providerName() external view returns (string memory);
  /**
   * @notice Returns the operator address that requires ERC20-approval for deposits.
   * @param asset address.
   * @param vault address required by some specific providers with multi-markets, otherwise pass address(0).
   */
  function approvedOperator(address asset, address vault) external view returns (address operator);

  /**
   * @notice Performs deposit operation at lending provider on behalf vault.
   * @param amount amount integer.
   * @param vault address calling this function.
   *
   * Requirements:
   * - This function should be delegate called in the context of a `vault`.
   */
  function deposit(uint256 amount, address vault) external returns (bool success);

  /**
   * @notice Performs borrow operation at lending provider on behalf vault.
   * @param amount amount integer.
   * @param vault address calling this function.
   *
   * Requirements:
   * - This function should be delegate called in the context of a `vault`.
   */
  function borrow(uint256 amount, address vault) external returns (bool success);

  /**
   * @notice Performs withdraw operation at lending provider on behalf vault.
   * @param amount amount integer.
   * @param vault address calling this function.
   *
   * Requirements:
   * - This function should be delegate called in the context of a `vault`.
   */
  function withdraw(uint256 amount, address vault) external returns (bool success);

  /**
   * of a `vault`.
   * @notice Performs payback operation at lending provider on behalf vault.
   * @param amount amount integer.
   * @param vault address calling this function.
   *
   * Requirements:
   * - This function should be delegate called in the context of a `vault`.
   * - Check there is erc20-approval to `approvedOperator` by the `vault` prior to call.
   */
  function payback(uint256 amount, address vault) external returns (bool success);

  /**
   * @notice Returns DEPOSIT balance of 'user' at lending provider.
   * @param user address whom balance is needed.
   * @param vault address required by some specific providers with multi-markets, otherwise pass address(0).
   *
   * - SHOULD NOT require Vault context.
   */
  function getDepositBalance(address user, address vault) external view returns (uint256 balance);

  /**
   * @notice Returns BORROW balance of 'user' at lending provider.
   * @param user address whom balance is needed.
   * @param vault address required by some specific providers with multi-markets, otherwise pass address(0).
   *
   * - SHOULD NOT require Vault context.
   */
  function getBorrowBalance(address user, address vault) external view returns (uint256 balance);

  /**
   * @notice Returns the latest SUPPLY annual percent rate (APR) at lending provider.
   * @param vault address required by some specific providers with multi-markets, otherwise pass address(0).
   *
   * - SHOULD return the rate in ray units (1e27)
   * Example 8.5% APR = 0.085 x 1e27 = 85000000000000000000000000
   * - SHOULD NOT require Vault context.
   */
  function getDepositRateFor(address vault) external view returns (uint256 rate);

  /**
   * @notice Returns the latest BORROW annual percent rate (APR) at lending provider.
   * @param vault address required by some specific providers with multi-markets, otherwise pass address(0).
   *
   * - SHOULD return the rate in ray units (1e27)
   * Example 8.5% APR = 0.085 x 1e27 = 85000000000000000000000000
   * - SHOULD NOT require Vault context.
   */
  function getBorrowRateFor(address vault) external view returns (uint256 rate);
}
