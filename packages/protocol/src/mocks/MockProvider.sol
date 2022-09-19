// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {ILendingProvider} from "../interfaces/ILendingProvider.sol";
import {IVault} from "../interfaces/IVault.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockProvider is ILendingProvider {
  /**
   * @notice See {ILendingProvider}
   */
  function approvedOperator(address, address) external pure override returns (address operator) {
    operator = address(0xAbc123);
  }

  /**
   * @notice See {ILendingProvider}
   */
  function deposit(address, uint256, IVault) external pure override returns (bool success) {
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function borrow(address asset, uint256 amount, IVault vault)
    external
    override
    returns (bool success)
  {
    MockERC20(asset).mintDebt(address(vault), amount);
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function withdraw(address asset, uint256 amount, IVault vault)
    external
    override
    returns (bool success)
  {
    MockERC20(asset).mint(address(vault), amount);
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function payback(address asset, uint256 amount, IVault vault)
    external
    override
    returns (bool success)
  {
    MockERC20(asset).burn(address(vault), amount);
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositRateFor(address, address) external pure override returns (uint256 rate) {
    rate = 1e27;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowRateFor(address, address) external pure override returns (uint256 rate) {
    rate = 1e27;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositBalance(address asset, address user, address)
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
  function getBorrowBalance(address asset, address user, address)
    external
    view
    override
    returns (uint256 balance)
  {
    balance = MockERC20(asset).balanceOfDebt(user);
  }
}
