// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IAaveProtocolDataProvider} from "../../interfaces/aaveV3/IAaveProtocolDataProvider.sol";
import {IPool} from "../../interfaces/aaveV3/IPool.sol";

/**
 * @title AaveV3 Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with AaveV3.
 */
contract AaveV3Rinkeby is ILendingProvider {
  function _getAaveProtocolDataProvider() internal pure returns (IAaveProtocolDataProvider) {
    return IAaveProtocolDataProvider(0xBAB2E7afF5acea53a43aEeBa2BA6298D8056DcE5);
  }

  function _getPool() internal pure returns (IPool) {
    return IPool(0xE039BdF1d874d27338e09B55CB09879Dedca52D8);
  }

  /**
   * @notice See {ILendingProvider}
   */
  function approvedOperator(address) external pure override returns (address operator) {
    operator = address(_getPool());
  }

  /**
   * @notice See {ILendingProvider}
   */
  function deposit(address asset, uint256 amount) external override returns (bool success) {
    IPool aave = _getPool();
    aave.supply(asset, amount, address(this), 0);
    aave.setUserUseReserveAsCollateral(asset, true);
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function borrow(address asset, uint256 amount) external override returns (bool success) {
    IPool aave = _getPool();
    aave.borrow(asset, amount, 2, 0, address(this));
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function withdraw(address asset, uint256 amount) external override returns (bool success) {
    IPool aave = _getPool();
    aave.withdraw(asset, amount, address(this));
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function payback(address asset, uint256 amount) external override returns (bool success) {
    IPool aave = _getPool();
    aave.repay(asset, amount, 2, address(this));
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositRateFor(address asset) external view override returns (uint256 rate) {
    IPool aaveData = _getPool();
    IPool.ReserveData memory rdata = aaveData.getReserveData(asset);
    rate = rdata.currentLiquidityRate;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowRateFor(address asset) external view override returns (uint256 rate) {
    IPool aaveData = _getPool();
    IPool.ReserveData memory rdata = aaveData.getReserveData(asset);
    rate = rdata.currentVariableBorrowRate;
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
    IAaveProtocolDataProvider aaveData = _getAaveProtocolDataProvider();
    (balance,,,,,,,,) = aaveData.getUserReserveData(asset, user);
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
    IAaveProtocolDataProvider aaveData = _getAaveProtocolDataProvider();
    (,, balance,,,,,,) = aaveData.getUserReserveData(asset, user);
  }
}
