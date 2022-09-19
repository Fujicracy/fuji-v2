// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Lending provider interface.
 * @author fujidao Labs
 * @notice  Defines the interface for core engine to perform operations at lending providers.
 * @dev Functions are intended to be called in the context of a Vault via delegateCall,
 * except indicated.
 */

import {IVault} from "./IVault.sol";

interface ILendingProvider {
  /**
   * @notice Returns the operator address that requires ERC20-approval for deposits.
   * @param asset address.
   * @param helper address required by some specific providers with multi-markets, otherwise pass address(0).
   */
  function approvedOperator(address asset, address helper) external view returns (address operator);

  /**
   * @notice Performs deposit operation at lending provider on behalf vault.
   * @param asset address.
   * @param amount amount integer.
   * @param vault address calling this function.
   *
   * Requirements:
   * - This function should be delegate called in the context of a `vault`.
   */
  function deposit(address asset, uint256 amount, IVault vault) external returns (bool success);

  /**
   * @notice Performs borrow operation at lending provider on behalf vault.
   * @param asset address.
   * @param amount amount integer.
   * @param vault address calling this function.
   *
   * Requirements:
   * - This function should be delegate called in the context of a `vault`.
   */
  function borrow(address asset, uint256 amount, IVault vault) external returns (bool success);

  /**
   * @notice Performs withdraw operation at lending provider on behalf vault.
   * @param asset address.
   * @param amount amount integer.
   * @param vault address calling this function.
   *
   * Requirements:
   * - This function should be delegate called in the context of a `vault`.
   */
  function withdraw(address asset, uint256 amount, IVault vault) external returns (bool success);

  /**
   * of a `vault`.
   * @notice Performs payback operation at lending provider on behalf vault.
   * @param asset address.
   * @param amount amount integer.
   * @param vault address calling this function.
   *
   * Requirements:
   * - This function should be delegate called in the context of a `vault`.
   * - Check there is erc20-approval to `approvedOperator` by the `vault` prior to call.
   */
  function payback(address asset, uint256 amount, IVault vault) external returns (bool success);

  /**
   * @notice Returns DEPOSIT balance of 'user' at lending provider.
   * @param asset address.
   * @param user address whom balance is needed.
   * @param helper address required by some specific providers with multi-markets, otherwise pass address(0).
   *
   * - SHOULD NOT require Vault context.
   */
  function getDepositBalance(address asset, address user, address helper)
    external
    view
    returns (uint256 balance);

  /**
   * @notice Returns BORROW balance of 'user' at lending provider.
   * @param asset address.
   * @param user address whom balance is needed.
   * @param helper address required by some specific providers with multi-markets, otherwise pass address(0).
   *
   * - SHOULD NOT require Vault context.
   */
  function getBorrowBalance(address asset, address user, address helper)
    external
    view
    returns (uint256 balance);

  /**
   * @notice Returns the latest SUPPLY annual percent rate (APR) at lending provider.
   * @param asset address.
   * @param helper address required by some specific providers with multi-markets, otherwise pass address(0).
   *
   * - SHOULD return the rate in ray units (1e27)
   * Example 8.5% APR = 0.085 x 1e27 = 85000000000000000000000000
   * - SHOULD NOT require Vault context.
   */
  function getDepositRateFor(address asset, address helper) external view returns (uint256 rate);

  /**
   * @notice Returns the latest BORROW annual percent rate (APR) at lending provider.
   * @param asset address.
   * @param helper address required by some specific providers with multi-markets, otherwise pass address(0).
   *
   * - SHOULD return the rate in ray units (1e27)
   * Example 8.5% APR = 0.085 x 1e27 = 85000000000000000000000000
   * - SHOULD NOT require Vault context.
   */
  function getBorrowRateFor(address asset, address helper) external view returns (uint256 rate);
}
