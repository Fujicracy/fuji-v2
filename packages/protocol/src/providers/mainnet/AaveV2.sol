// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IV2Pool} from "../../interfaces/aaveV2/IV2Pool.sol";

/**
 * @title AaveV2 Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with AaveV2.
 */
contract AaveV2 is ILendingProvider {
  function _getPool() internal pure returns (IV2Pool) {
    return IV2Pool(0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9);
  }

  /// inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "Aave_V2";
  }

  /// inheritdoc ILendingProvider
  function approvedOperator(address, address) external pure override returns (address operator) {
    operator = address(_getPool());
  }

  /// inheritdoc ILendingProvider
  function deposit(address asset, uint256 amount, address vault)
    external
    override
    returns (bool success)
  {
    IV2Pool aave = _getPool();
    aave.deposit(asset, amount, vault, 0);
    // aave.setUserUseReserveAsCollateral(asset, true);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function borrow(address asset, uint256 amount, address vault)
    external
    override
    returns (bool success)
  {
    IV2Pool aave = _getPool();
    aave.borrow(asset, amount, 2, 0, vault);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function withdraw(address asset, uint256 amount, address vault)
    external
    override
    returns (bool success)
  {
    IV2Pool aave = _getPool();
    aave.withdraw(asset, amount, vault);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function payback(address asset, uint256 amount, address vault)
    external
    override
    returns (bool success)
  {
    IV2Pool aave = _getPool();
    aave.repay(asset, amount, 2, vault);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function getDepositRateFor(address asset, address) external view override returns (uint256 rate) {
    IV2Pool aaveData = _getPool();
    IV2Pool.ReserveData memory rdata = aaveData.getReserveData(asset);
    rate = rdata.currentLiquidityRate;
  }

  /// inheritdoc ILendingProvider
  function getBorrowRateFor(address asset, address) external view override returns (uint256 rate) {
    IV2Pool aaveData = _getPool();
    IV2Pool.ReserveData memory rdata = aaveData.getReserveData(asset);
    rate = rdata.currentVariableBorrowRate;
  }

  /// inheritdoc ILendingProvider
  function getDepositBalance(address asset, address user, address)
    external
    view
    override
    returns (uint256 balance)
  {
    IV2Pool aaveData = _getPool();
    IV2Pool.ReserveData memory rdata = aaveData.getReserveData(asset);
    balance = IERC20(rdata.aTokenAddress).balanceOf(user);
  }

  /// inheritdoc ILendingProvider
  function getBorrowBalance(address asset, address user, address)
    external
    view
    override
    returns (uint256 balance)
  {
    IV2Pool aaveData = _getPool();
    IV2Pool.ReserveData memory rdata = aaveData.getReserveData(asset);
    balance = IERC20(rdata.variableDebtTokenAddress).balanceOf(user);
  }
}
