// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {ILendingProvider} from "../interfaces/ILendingProvider.sol";
import {IVault} from "../interfaces/IVault.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockProvider is ILendingProvider {
  /**
   * @notice See {ILendingProvider}
   */
  function providerName() public pure virtual override returns (string memory) {
    return "Mock_V1";
  }
  /**
   * @notice See {ILendingProvider}
   */

  function approvedOperator(
    address asset,
    address
  )
    external
    pure
    override
    returns (address operator)
  {
    operator = asset;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20 merc20 = MockERC20(vault.asset());
    try merc20.makeDeposit(address(vault), amount, providerName()) returns (bool result) {
      success = result;
    } catch {}
  }

  /**
   * @notice See {ILendingProvider}
   */
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20 merc20 = MockERC20(vault.debtAsset());
    try merc20.mintDebt(address(vault), amount, providerName()) returns (bool result) {
      success = result;
    } catch {}
  }

  /**
   * @notice See {ILendingProvider}
   */
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20 merc20 = MockERC20(vault.asset());
    try merc20.withdrawDeposit(address(vault), amount, providerName()) returns (bool result) {
      success = result;
    } catch {}
  }

  /**
   * @notice See {ILendingProvider}
   */
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20 merc20 = MockERC20(vault.debtAsset());
    try merc20.burnDebt(address(vault), amount, providerName()) returns (bool result) {
      success = result;
    } catch {}
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
    balance = MockERC20(vault.asset()).balanceOfDeposit(user, providerName());
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
