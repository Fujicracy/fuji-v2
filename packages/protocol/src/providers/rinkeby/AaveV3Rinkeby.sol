// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IV3Pool} from "../../interfaces/aaveV3/IV3Pool.sol";

/**
 * @title AaveV3 Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with AaveV3.
 */
contract AaveV3Rinkeby is ILendingProvider {
  function _getPool() internal pure returns (IV3Pool) {
    return IV3Pool(0xE039BdF1d874d27338e09B55CB09879Dedca52D8);
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
    IV3Pool aave = _getPool();
    aave.supply(asset, amount, vault, 0);
    aave.setUserUseReserveAsCollateral(asset, true);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function borrow(address asset, uint256 amount, address vault)
    external
    override
    returns (bool success)
  {
    IV3Pool aave = _getPool();
    aave.borrow(asset, amount, 2, 0, vault);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function withdraw(address asset, uint256 amount, address vault)
    external
    override
    returns (bool success)
  {
    IV3Pool aave = _getPool();
    aave.withdraw(asset, amount, vault);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function payback(address asset, uint256 amount, address vault)
    external
    override
    returns (bool success)
  {
    IV3Pool aave = _getPool();
    aave.repay(asset, amount, 2, vault);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function getDepositRateFor(address asset, address) external view override returns (uint256 rate) {
    IV3Pool aaveData = _getPool();
    IV3Pool.ReserveData memory rdata = aaveData.getReserveData(asset);
    rate = rdata.currentLiquidityRate;
  }

  /// inheritdoc ILendingProvider
  function getBorrowRateFor(address asset, address) external view override returns (uint256 rate) {
    IV3Pool aaveData = _getPool();
    IV3Pool.ReserveData memory rdata = aaveData.getReserveData(asset);
    rate = rdata.currentVariableBorrowRate;
  }

  /// inheritdoc ILendingProvider
  function getDepositBalance(address asset, address user, address)
    external
    view
    override
    returns (uint256 balance)
  {
    IV3Pool aaveData = _getPool();
    IV3Pool.ReserveData memory rdata = aaveData.getReserveData(asset);
    balance = IERC20(rdata.aTokenAddress).balanceOf(user);
  }

  /// inheritdoc ILendingProvider
  function getBorrowBalance(address asset, address user, address)
    external
    view
    override
    returns (uint256 balance)
  {
    IV3Pool aaveData = _getPool();
    IV3Pool.ReserveData memory rdata = aaveData.getReserveData(asset);
    balance = IERC20(rdata.variableDebtTokenAddress).balanceOf(user);
  }
}
