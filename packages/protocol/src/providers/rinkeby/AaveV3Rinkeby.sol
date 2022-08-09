// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import "../../interfaces/aaveV3/IAaveProtocolDataProvider.sol";
import "../../interfaces/aaveV3/IPool.sol";
import "../../interfaces/ILendingProvider.sol";
import "../../interfaces/IUnwrapper.sol";
import "../../interfaces/IWETH.sol";
import "../../libraries/UniversalERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/**
 * @title AaveV3 Lending Provider.
 * @author Fujidao Labs
 * @notice Adapter for AaveV3.
 */
contract AaveV3Rinkeby is ILendingProvider {
  using UniversalERC20 for IERC20;

  function _getNativeAddr() internal pure returns (address) {
    return 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
  }

  function _getWrappedNativeAddr() internal pure returns (address) {
    return 0xd74047010D77c5901df5b0f9ca518aED56C85e8D;
  }

  function _getAaveProtocolDataProvider() internal pure returns (IAaveProtocolDataProvider) {
    return IAaveProtocolDataProvider(0xBAB2E7afF5acea53a43aEeBa2BA6298D8056DcE5);
  }

  function _getPool() internal pure returns (IPool) {
    return IPool(0xE039BdF1d874d27338e09B55CB09879Dedca52D8);
  }

  function _getUnwrapper() internal pure returns (address) {
    return 0xBB73511B0099eF355AA580D0149AC4C679A0B805;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function approvedOperator(address) external pure returns (address operator) {
    operator = address(_getPool());
  }

  /**
   * @notice See {ILendingProvider}
   */
  function deposit(address asset, uint256 amount) external returns (bool success) {
    IPool aave = _getPool();

    aave.supply(asset, amount, address(this), 0);

    aave.setUserUseReserveAsCollateral(asset, true);
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function borrow(address asset, uint256 amount) external returns (bool success) {
    IPool aave = _getPool();
    bool isNative = asset == _getNativeAddr();
    address _tokenAddr = isNative ? _getWrappedNativeAddr() : asset;

    aave.borrow(_tokenAddr, amount, 2, 0, address(this));

    // convert Native to WrappedNative
    if (isNative) {
      address unwrapper = _getUnwrapper();
      IERC20(_tokenAddr).univTransfer(payable(unwrapper), amount);
      IUnwrapper(unwrapper).withdraw(amount);
    }
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function withdraw(address asset, uint256 amount) external returns (bool success) {
    IPool aave = _getPool();
    bool isNative = asset == _getNativeAddr();
    address _tokenAddr = isNative ? _getWrappedNativeAddr() : asset;

    aave.withdraw(_tokenAddr, amount, address(this));

    // convert Native to WrappedNative
    if (isNative) {
      address unwrapper = _getUnwrapper();
      IERC20(_tokenAddr).univTransfer(payable(unwrapper), amount);
      IUnwrapper(unwrapper).withdraw(amount);
    }
    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function payback(address asset, uint256 amount) external returns (bool success) {
    IPool aave = _getPool();
    bool isNative = asset == _getNativeAddr();
    address _tokenAddr = isNative ? _getWrappedNativeAddr() : asset;
    // convert Native to WrappedNative
    if (isNative) IWETH(_tokenAddr).deposit{value: amount}();
    IERC20(_tokenAddr).univApprove(address(aave), amount);

    aave.repay(_tokenAddr, amount, 2, address(this));

    success = true;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositRateFor(address asset) external view returns (uint256 rate) {
    IPool aaveData = _getPool();
    IPool.ReserveData memory rdata =
      aaveData.getReserveData(asset == _getNativeAddr() ? _getWrappedNativeAddr() : asset);
    rate = rdata.currentLiquidityRate;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowRateFor(address asset) external view returns (uint256 rate) {
    IPool aaveData = _getPool();
    IPool.ReserveData memory rdata =
      aaveData.getReserveData(asset == _getNativeAddr() ? _getWrappedNativeAddr() : asset);
    rate = rdata.currentVariableBorrowRate;
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getDepositBalance(address asset, address user) external view returns (uint256 balance) {
    IAaveProtocolDataProvider aaveData = _getAaveProtocolDataProvider();
    bool isNative = asset == _getNativeAddr();
    address _tokenAddr = isNative ? _getWrappedNativeAddr() : asset;
    (balance,,,,,,,,) = aaveData.getUserReserveData(_tokenAddr, user);
  }

  /**
   * @notice See {ILendingProvider}
   */
  function getBorrowBalance(address asset, address user) external view returns (uint256 balance) {
    IAaveProtocolDataProvider aaveData = _getAaveProtocolDataProvider();
    bool isNative = asset == _getNativeAddr();
    address _tokenAddr = isNative ? _getWrappedNativeAddr() : asset;
    (,, balance,,,,,,) = aaveData.getUserReserveData(_tokenAddr, user);
  }
}
