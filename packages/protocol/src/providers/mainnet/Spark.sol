// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Spark
 *
 * @author Fujidao Labs
 *
 * @notice This contract allows interaction with Spark.
 */

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IV3Pool} from "../../interfaces/aaveV3/IV3Pool.sol";

contract Spark is ILendingProvider {
  /**
   * @dev Returns the {IV3Pool} pool to interact with Spark
   */
  function _getPool() internal pure returns (IV3Pool) {
    return IV3Pool(0xC13e21B648A5Ee794902342038FF3aDAB66BE987);
  }

  /// @inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "Spark";
  }

  /// @inheritdoc ILendingProvider
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

  /// @inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    IV3Pool aave = _getPool();
    address asset = vault.asset();
    aave.supply(asset, amount, address(vault), 0);
    aave.setUserUseReserveAsCollateral(asset, true);
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    IV3Pool spark = _getPool();
    spark.borrow(vault.debtAsset(), amount, 2, 0, address(vault));
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    IV3Pool spark = _getPool();
    spark.withdraw(vault.asset(), amount, address(vault));
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    IV3Pool spark = _getPool();
    spark.repay(vault.debtAsset(), amount, 2, address(vault));
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function getDepositRateFor(IVault vault) external view override returns (uint256 rate) {
    IV3Pool sparkData = _getPool();
    IV3Pool.ReserveData memory rdata = sparkData.getReserveData(vault.asset());
    rate = rdata.currentLiquidityRate;
  }

  /// @inheritdoc ILendingProvider
  function getBorrowRateFor(IVault vault) external view override returns (uint256 rate) {
    IV3Pool sparkData = _getPool();
    IV3Pool.ReserveData memory rdata = sparkData.getReserveData(vault.debtAsset());
    rate = rdata.currentVariableBorrowRate;
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
    IV3Pool sparkData = _getPool();
    IV3Pool.ReserveData memory rdata = sparkData.getReserveData(vault.asset());
    balance = IERC20(rdata.aTokenAddress).balanceOf(user);
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
    IV3Pool sparkData = _getPool();
    IV3Pool.ReserveData memory rdata = sparkData.getReserveData(vault.debtAsset());
    balance = IERC20(rdata.variableDebtTokenAddress).balanceOf(user);
  }
}
