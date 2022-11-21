// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {ILendingProvider} from "../interfaces/ILendingProvider.sol";
import {IVault} from "../interfaces/IVault.sol";
import {MockERC20} from "./MockERC20.sol";

// used only in Connext forking testnets environement
contract MockProviderV0 is ILendingProvider {
  /**
   * @notice See {ILendingProvider}
   */
  function providerName() public pure override returns (string memory) {
    return "Mock_V0";
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
  function deposit(uint256, IVault) external pure override returns (bool success) {
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20(vault.debtAsset()).mintDebt(address(vault), amount, providerName());
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20(vault.asset()).mint(address(vault), amount);
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20(vault.debtAsset()).burnDebt(address(vault), amount, providerName());
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositRateFor(IVault) external pure override returns (uint256 rate) {
    rate = 1e27;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowRateFor(IVault) external pure override returns (uint256 rate) {
    rate = 1e27;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositBalance(
    address user,
    IVault vault
  )
    external
    view
    override
    returns (uint256 balance)
  {
    balance = MockERC20(vault.asset()).balanceOf(user);
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowBalance(
    address user,
    IVault vault
  )
    external
    view
    override
    returns (uint256 balance)
  {
    balance = MockERC20(vault.debtAsset()).balanceOfDebt(user, providerName());
  }
}
