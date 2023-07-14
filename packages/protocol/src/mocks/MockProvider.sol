// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

/**
 * @title MockProvider
 *
 * @author Fuijdao Labs
 *
 * @notice Mock implementation of a lending provider.
 *
 * @dev This contract works in conjunction with
 * {MockERC20} to allow simulation and tracking of token
 * balances.
 */

import {ILendingProvider} from "../interfaces/ILendingProvider.sol";
import {IHarvestable} from "../interfaces/IHarvestable.sol";
import {IVault} from "../interfaces/IVault.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockProvider is ILendingProvider, IHarvestable {
  /// @inheritdoc ILendingProvider
  function providerName() public pure virtual override returns (string memory) {
    return "Mock_V1";
  }

  /// @inheritdoc ILendingProvider
  function approvedOperator(
    address keyAsset,
    address,
    address
  )
    external
    pure
    override
    returns (address operator)
  {
    operator = keyAsset;
  }

  /// @inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20 merc20 = MockERC20(vault.asset());
    try merc20.makeDeposit(address(vault), amount, providerName()) returns (bool result) {
      success = result;
    } catch {}
  }

  /// @inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20 merc20 = MockERC20(vault.debtAsset());
    try merc20.mintDebt(address(vault), amount, providerName()) returns (bool result) {
      success = result;
    } catch {}
  }

  /// @inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20 merc20 = MockERC20(vault.asset());
    try merc20.withdrawDeposit(address(vault), amount, providerName()) returns (bool result) {
      success = result;
    } catch {}
  }

  /// @inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    MockERC20 merc20 = MockERC20(vault.debtAsset());
    try merc20.burnDebt(address(vault), amount, providerName()) returns (bool result) {
      success = result;
    } catch {}
  }

  /// @inheritdoc ILendingProvider
  function getDepositRateFor(IVault) external pure override returns (uint256 rate) {
    rate = 1e27;
  }

  /// @inheritdoc ILendingProvider
  function getBorrowRateFor(IVault) external pure override returns (uint256 rate) {
    rate = 1e27;
  }

  /// @inheritdoc ILendingProvider
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

  /// @inheritdoc ILendingProvider
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

  /// @inheritdoc IHarvestable
  /// @dev mocking rewards for test purposes
  /// will assume rewards are given in vault.asset and always 1e18
  function harvest(bytes memory data)
    external
    returns (address[] memory tokens, uint256[] memory amounts)
  {
    IVault vault = abi.decode(data, (IVault));
    MockERC20 merc20 = MockERC20(vault.asset());
    try merc20.mintRewards(address(vault), 1e18, providerName()) returns (bool /* result */ ) {
      return previewHarvest(vault);
    } catch {}
  }

  /// @inheritdoc IHarvestable
  function previewHarvest(IVault vault)
    public
    view
    returns (address[] memory tokens, uint256[] memory amounts)
  {
    tokens = new address[](1);
    tokens[0] = vault.asset();
    amounts = new uint256[](1);
    amounts[0] = 1e18;
  }
}
