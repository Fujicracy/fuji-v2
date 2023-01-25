// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IV2Pool} from "../../interfaces/aaveV2/IV2Pool.sol";

/**
 * @title Agave Lending Provider
 * @author Fujidao Labs
 * @notice This contract allows interaction with Agave.
 */
contract AgaveGnosis is ILendingProvider {
  /**
   * @dev Returns the IV3Pool pool to interact with Agave
   */
  function _getPool() internal pure returns (IV2Pool) {
    return IV2Pool(0x5E15d5E33d318dCEd84Bfe3F4EACe07909bE6d9c);
  }

  /// inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "Agave_Gnosis";
  }

  /// inheritdoc ILendingProvider
  function approvedOperator(
    address,
    address,
    address
  )
    external
    pure
    override
    returns (address operator)
  {
    operator = address(_getPool());
  }

  /// inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    IV2Pool agave = _getPool();
    agave.deposit(vault.asset(), amount, address(vault), 0);
    // agave.setUserUseReserveAsCollateral(asset, true);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    IV2Pool agave = _getPool();
    agave.borrow(vault.debtAsset(), amount, 2, 0, address(vault));
    success = true;
  }

  /// inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    IV2Pool agave = _getPool();
    agave.withdraw(vault.asset(), amount, address(vault));
    success = true;
  }

  /// inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    IV2Pool agave = _getPool();
    agave.repay(vault.debtAsset(), amount, 2, address(vault));
    success = true;
  }

  /// inheritdoc ILendingProvider
  function getDepositRateFor(IVault vault) external view override returns (uint256 rate) {
    IV2Pool agaveData = _getPool();
    IV2Pool.ReserveData memory rdata = agaveData.getReserveData(vault.asset());
    rate = rdata.currentLiquidityRate;
  }

  /// inheritdoc ILendingProvider
  function getBorrowRateFor(IVault vault) external view override returns (uint256 rate) {
    IV2Pool agaveData = _getPool();
    IV2Pool.ReserveData memory rdata = agaveData.getReserveData(vault.debtAsset());
    rate = rdata.currentVariableBorrowRate;
  }

  /// inheritdoc ILendingProvider
  function getDepositBalance(
    address user,
    IVault vault
  )
    external
    view
    override
    returns (uint256 balance)
  {
    IV2Pool agaveData = _getPool();
    IV2Pool.ReserveData memory rdata = agaveData.getReserveData(vault.asset());
    balance = IERC20(rdata.aTokenAddress).balanceOf(user);
  }

  /// inheritdoc ILendingProvider
  function getBorrowBalance(
    address user,
    IVault vault
  )
    external
    view
    override
    returns (uint256 balance)
  {
    IV2Pool agaveData = _getPool();
    IV2Pool.ReserveData memory rdata = agaveData.getReserveData(vault.debtAsset());
    balance = IERC20(rdata.variableDebtTokenAddress).balanceOf(user);
  }
}
