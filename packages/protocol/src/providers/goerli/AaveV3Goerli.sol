// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IAaveV3DataProvider} from "../../interfaces/aaveV3/IAaveV3DataProvider.sol";
import {IV3Pool} from "../../interfaces/aaveV3/IV3Pool.sol";

/**
 * @title AaveV3 Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with AaveV3.
 */
contract AaveV3Goerli is ILendingProvider {
  function _getAaveDataProvider() internal pure returns (IAaveV3DataProvider) {
    return IAaveV3DataProvider(0x9BE876c6DC42215B00d7efe892E2691C3bc35d10);
  }

  function _getPool() internal pure returns (IV3Pool) {
    return IV3Pool(0x368EedF3f56ad10b9bC57eed4Dac65B26Bb667f6);
  }

  /// inheritdoc ILendingProvider
  function approvedOperator(address, address) external pure override returns (address operator) {
    operator = address(_getPool());
  }

  /// inheritdoc ILendingProvider
  function deposit(address asset, uint256 amount, IVault vault)
    external
    override
    returns (bool success)
  {
    IV3Pool aave = _getPool();
    aave.supply(asset, amount, address(vault), 0);
    aave.setUserUseReserveAsCollateral(asset, true);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function borrow(address asset, uint256 amount, IVault vault)
    external
    override
    returns (bool success)
  {
    IV3Pool aave = _getPool();
    aave.borrow(asset, amount, 2, 0, address(vault));
    success = true;
  }

  /// inheritdoc ILendingProvider
  function withdraw(address asset, uint256 amount, IVault vault)
    external
    override
    returns (bool success)
  {
    IV3Pool aave = _getPool();
    aave.withdraw(asset, amount, address(vault));
    success = true;
  }

  /// inheritdoc ILendingProvider
  function payback(address asset, uint256 amount, IVault vault)
    external
    override
    returns (bool success)
  {
    IV3Pool aave = _getPool();
    aave.repay(asset, amount, 2, address(vault));
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
    IAaveV3DataProvider aaveData = _getAaveDataProvider();
    (balance,,,,,,,,) = aaveData.getUserReserveData(asset, user);
  }

  /// inheritdoc ILendingProvider
  function getBorrowBalance(address asset, address user, address)
    external
    view
    override
    returns (uint256 balance)
  {
    IAaveV3DataProvider aaveData = _getAaveDataProvider();
    (,, balance,,,,,,) = aaveData.getUserReserveData(asset, user);
  }
}
