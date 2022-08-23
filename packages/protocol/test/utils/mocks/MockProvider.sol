// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockProvider is ILendingProvider {
  /**
   * @notice See {ILendingProvider}
   */
  function approvedOperator(address) external pure override returns (address operator) {
    operator = address(0xAbc123);
  }

  /**
   * @notice See {ILendingProvider}
   */
  function deposit(address asset, uint256 amount) external pure override returns (bool success) {
    asset;
    amount;
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function borrow(address asset, uint256 amount) external override returns (bool success) {
    MockERC20(asset).mint(address(this), amount);
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function withdraw(address asset, uint256 amount) external override returns (bool success) {
    MockERC20(asset).mint(address(this), amount);
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function payback(address asset, uint256 amount) external pure override returns (bool success) {
    asset;
    amount;
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositRateFor(address asset) external pure override returns (uint256 rate) {
    asset;
    rate = 1;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowRateFor(address asset) external pure override returns (uint256 rate) {
    asset;
    rate = 1;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositBalance(address asset, address user)
    external
    view
    override
    returns (uint256 balance)
  {
    balance = MockERC20(asset).balanceOf(user);
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowBalance(address asset, address user)
    external
    view
    override
    returns (uint256 balance)
  {
    user;
    balance = MockERC20(asset).totalSupply();
  }
}
