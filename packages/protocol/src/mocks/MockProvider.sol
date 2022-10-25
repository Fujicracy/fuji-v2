// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {ILendingProvider} from "../interfaces/ILendingProvider.sol";
import {IVault} from "../interfaces/IVault.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockProvider is ILendingProvider {
  /**
   * @notice See {ILendingProvider}
   */
  function providerName() public pure override returns (string memory) {
    return "Mock_V1";
  }
  /**
   * @notice See {ILendingProvider}
   */

  function approvedOperator(address, address) external pure override returns (address operator) {
    operator = address(0xAbc123);
  }

  /**
   * @notice See {ILendingProvider}
   */
  function deposit(uint256, address) external pure override returns (bool success) {
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function borrow(uint256 amount, address vault) external override returns (bool success) {
    MockERC20(IVault(vault).debtAsset()).mintDebt(vault, amount);
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function withdraw(uint256 amount, address vault) external override returns (bool success) {
    MockERC20(IVault(vault).asset()).mint(vault, amount);
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function payback(uint256 amount, address vault) external override returns (bool success) {
    MockERC20(IVault(vault).debtAsset()).burnDebt(vault, amount);
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositRateFor(address) external pure override returns (uint256 rate) {
    rate = 1e27;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowRateFor(address) external pure override returns (uint256 rate) {
    rate = 1e27;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositBalance(address user, address vault)
    external
    view
    override
    returns (uint256 balance)
  {
    balance = MockERC20(IVault(vault).asset()).balanceOf(user);
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowBalance(address user, address vault)
    external
    view
    override
    returns (uint256 balance)
  {
    balance = MockERC20(IVault(vault).debtAsset()).balanceOfDebt(user);
  }
}
