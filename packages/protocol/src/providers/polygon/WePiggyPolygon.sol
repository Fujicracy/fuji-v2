// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IAddrMapper} from "../../interfaces/IAddrMapper.sol";
import {IComptroller} from "../../interfaces/compoundV2/IComptroller.sol";
import {ICETH} from "../../interfaces/compoundV2/ICETH.sol";
import {ICERC20} from "../../interfaces/compoundV2/ICERC20.sol";
import {IGenCToken} from "../../interfaces/compoundV2/IGenCToken.sol";
import {ICETH} from "../../interfaces/compoundV2/ICETH.sol";
import {ICERC20} from "../../interfaces/compoundV2/ICERC20.sol";
import {IWETH9} from "../../abstracts/WETH9.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title WePiggy Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with WePiggy.
 */

//wmatic
// 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270
// 0xC1B02E52e9512519EDF99671931772E452fb4399
contract WePiggyPolygon is ILendingProvider {
  using SafeERC20 for IERC20;

  error WePiggy__deposit_failed(uint256 status);
  error WePiggy__payback_failed(uint256 status);
  error WePiggy__withdraw_failed(uint256 status);
  error WePiggy__borrow_failed(uint256 status);

  function _isWMATIC(address token) internal pure returns (bool) {
    return token == 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
  }

  function _getAddrmapper() internal pure returns (IAddrMapper) {
    // TODO Define final address after deployment strategy is set.
    return IAddrMapper(0xe7Aa20127f910dC20492B320f1c0CaB12DFD4153);
  }

  function _getCToken(address underlying) internal view returns (address cToken) {
    cToken = _getAddrmapper().getAddressMapping("WePiggy", underlying);
  }

  function _getComptrollerAddress() internal pure returns (address) {
    return 0xFfceAcfD39117030314A07b2C86dA36E51787948; // WePiggy Polygon
  }

  /**
   * @dev Approves vault's assets as collateral for Compound Protocol.
   * @param _cTokenAddress: asset type to be approved as collateral.
   */
  function _enterCollatMarket(address _cTokenAddress) internal {
    // Create a reference to the corresponding network Comptroller
    IComptroller comptroller = IComptroller(_getComptrollerAddress());

    address[] memory cTokenMarkets = new address[](1);
    cTokenMarkets[0] = _cTokenAddress;
    comptroller.enterMarkets(cTokenMarkets);
  }

  /// inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "WePiggy_Polygon";
  }

  /// inheritdoc ILendingProvider
  function approvedOperator(address, address) external pure override returns (address operator) {
    operator = _getComptrollerAddress();
  }

  /// inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.asset();
    address cTokenAddr = _getCToken(asset);

    _enterCollatMarket(cTokenAddr);

    if (_isWMATIC(asset)) {
      //unwrap WMATIC to ETH
      //TODO unwrap matic instead of weth eth
      IWETH9(asset).withdraw(amount);

      ICETH cToken = ICETH(cTokenAddr);

      // Compound protocol Mints cTokens, ETH method
      cToken.mint{value: amount}();
    } else {
      ICERC20 cToken = ICERC20(cTokenAddr);

      IERC20(asset).safeApprove(cTokenAddr, amount);

      uint256 status = cToken.mint(amount);
      if (status != 0) {
        revert WePiggy__deposit_failed(status);
      }
    }
    success = true;
  }

  /// inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.debtAsset();
    address cTokenAddr = _getCToken(asset);

    IGenCToken cToken = IGenCToken(cTokenAddr);

    uint256 status = cToken.borrow(amount);

    if (status != 0) {
      revert WePiggy__borrow_failed(status);
    }

    if (_isWMATIC(asset)) {
      // wrap ETH to WETH
      //TODO unwrap matic instead of weth eth
      IWETH9(asset).deposit{value: amount}();
    }
    success = true;
  }

  /// inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.asset();
    address cTokenAddr = _getCToken(asset);

    IGenCToken cToken = IGenCToken(cTokenAddr);

    uint256 status = cToken.redeemUnderlying(amount);

    if (status != 0) {
      revert WePiggy__withdraw_failed(status);
    }

    if (_isWMATIC(asset)) {
      // wrap ETH to WETH
      //TODO unwrap matic instead of weth eth
      IWETH9(asset).deposit{value: amount}();
    }
    success = true;
  }

  /// inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.debtAsset();
    address cTokenAddr = _getCToken(asset);

    if (_isWMATIC(asset)) {
      ICETH cToken = ICETH(cTokenAddr);
      //unwrap WETH to ETH
      //TODO unwrap matic instead of weth eth
      IWETH9(asset).withdraw(amount);

      cToken.repayBorrow{value: amount}();
    } else {
      ICERC20 cToken = ICERC20(cTokenAddr);

      IERC20(asset).safeApprove(cTokenAddr, amount);
      uint256 status = cToken.repayBorrow(amount);

      if (status != 0) {
        revert WePiggy__payback_failed(status);
      }
    }
    success = true;
  }

  /// inheritdoc ILendingProvider
  function getDepositRateFor(IVault vault) external view override returns (uint256 rate) {
    address cTokenAddr = _getCToken(vault.asset());

    // Block Rate transformed for common mantissa for Fuji in ray (1e27), Note: Compound uses base 1e18
    uint256 bRateperBlock = IGenCToken(cTokenAddr).supplyRatePerBlock() * 10 ** 9;

    // The approximate number of blocks per year that is assumed by the Compound interest rate model
    uint256 blocksperYear = 2102400;
    rate = bRateperBlock * blocksperYear;
  }

  /// inheritdoc ILendingProvider
  function getBorrowRateFor(IVault vault) external view override returns (uint256 rate) {
    address cTokenAddr = _getCToken(vault.debtAsset());

    // Block Rate transformed for common mantissa for Fuji in ray (1e27), Note: Compound uses base 1e18
    uint256 bRateperBlock = IGenCToken(cTokenAddr).borrowRatePerBlock() * 10 ** 9;

    // The approximate number of blocks per year that is assumed by the Compound interest rate model
    uint256 blocksperYear = 2102400;
    rate = bRateperBlock * blocksperYear;
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
    address cTokenAddr = _getCToken(vault.asset());
    uint256 cTokenBal = IGenCToken(cTokenAddr).balanceOf(user);
    uint256 exRate = IGenCToken(cTokenAddr).exchangeRateStored();

    balance = (exRate * cTokenBal) / 1e18;
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
    address cTokenAddr = _getCToken(vault.debtAsset());

    balance = IGenCToken(cTokenAddr).borrowBalanceStored(user);
  }
}
