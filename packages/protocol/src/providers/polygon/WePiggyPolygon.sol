// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title  WePiggyPolygon
 *
 * @author Fujidao Labs
 *
 * @notice This contract allows interaction with WePiggy.
 *
 * @dev The IAddrMapper needs to be properly configured for WePiggy.
 */

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IAddrMapper} from "../../interfaces/IAddrMapper.sol";
import {IComptroller} from "../../interfaces/compoundV2/IComptroller.sol";
import {ICETH} from "../../interfaces/compoundV2/ICETH.sol";
import {ICERC20} from "../../interfaces/compoundV2/ICERC20.sol";
import {ICToken} from "../../interfaces/compoundV2/ICToken.sol";
import {ICETH} from "../../interfaces/compoundV2/ICETH.sol";
import {ICERC20} from "../../interfaces/compoundV2/ICERC20.sol";
import {IWETH9} from "../../abstracts/WETH9.sol";
import {LibCompoundV2} from "../../libraries/LibCompoundV2.sol";

contract WePiggyPolygon is ILendingProvider {
  error WePiggy__deposit_failed(uint256 status);
  error WePiggy__payback_failed(uint256 status);
  error WePiggy__withdraw_failed(uint256 status);
  error WePiggy__borrow_failed(uint256 status);

  /**
   * @dev Returns true/false wether the given 'token' is/isn't WMATIC.
   *
   * @param token address of the 'token'
   */
  function _isWMATIC(address token) internal pure returns (bool) {
    return token == 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
  }

  /**
   * @dev Returns the {IAddrMapper} on this chain.
   */
  function _getAddrmapper() internal pure returns (IAddrMapper) {
    // TODO Define final address after deployment strategy is set.
    return IAddrMapper(0xe7Aa20127f910dC20492B320f1c0CaB12DFD4153);
  }

  /**
   * @dev Returns WePiggy's underlying {ICToken} associated with the 'asset' to interact with WePiggy.
   *
   * @param asset address of the token to be used as collateral/debt.
   */
  function _getCToken(address asset) internal view returns (address cToken) {
    cToken = _getAddrmapper().getAddressMapping("WePiggy", asset);
  }

  /**
   * @dev Returns the Controller address of WePiggy.
   */
  function _getComptrollerAddress() internal pure returns (address) {
    return 0xFfceAcfD39117030314A07b2C86dA36E51787948; // WePiggy Polygon
  }

  /**
   * @dev Approves vault's assets as collateral for WePiggy Protocol.
   *
   * @param _cTokenAddress address of the asset to be approved as collateral.
   */
  function _enterCollatMarket(address _cTokenAddress) internal {
    // Create a reference to the corresponding network Comptroller
    IComptroller comptroller = IComptroller(_getComptrollerAddress());

    address[] memory cTokenMarkets = new address[](1);
    cTokenMarkets[0] = _cTokenAddress;
    comptroller.enterMarkets(cTokenMarkets);
  }

  /// @inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "WePiggy_Polygon";
  }

  /// @inheritdoc ILendingProvider
  function approvedOperator(
    address keyAsset,
    address,
    address
  )
    external
    view
    override
    returns (address operator)
  {
    operator = _getCToken(keyAsset);
  }

  /// @inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.asset();
    address cTokenAddr = _getCToken(asset);

    _enterCollatMarket(cTokenAddr);

    if (_isWMATIC(asset)) {
      // unwrap WMATIC to MATIC
      IWETH9(asset).withdraw(amount);

      ICETH cToken = ICETH(cTokenAddr);

      // Compound protocol Mints cTokens, ETH method
      cToken.mint{value: amount}();
    } else {
      ICERC20 cToken = ICERC20(cTokenAddr);

      uint256 status = cToken.mint(amount);
      if (status != 0) {
        revert WePiggy__deposit_failed(status);
      }
    }
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.debtAsset();
    address cTokenAddr = _getCToken(asset);

    ICToken cToken = ICToken(cTokenAddr);

    uint256 status = cToken.borrow(amount);

    if (status != 0) {
      revert WePiggy__borrow_failed(status);
    }

    if (_isWMATIC(asset)) {
      // wrap MATIC to WMATIC
      IWETH9(asset).deposit{value: amount}();
    }
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.asset();
    address cTokenAddr = _getCToken(asset);

    ICToken cToken = ICToken(cTokenAddr);

    uint256 status = cToken.redeemUnderlying(amount);

    if (status != 0) {
      revert WePiggy__withdraw_failed(status);
    }

    if (_isWMATIC(asset)) {
      // wrap MATIC to WMATIC
      IWETH9(asset).deposit{value: amount}();
    }
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.debtAsset();
    address cTokenAddr = _getCToken(asset);

    if (_isWMATIC(asset)) {
      ICETH cToken = ICETH(cTokenAddr);
      // unwrap WMATIC to MATIC
      IWETH9(asset).withdraw(amount);

      cToken.repayBorrow{value: amount}();
    } else {
      ICERC20 cToken = ICERC20(cTokenAddr);

      uint256 status = cToken.repayBorrow(amount);

      if (status != 0) {
        revert WePiggy__payback_failed(status);
      }
    }
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function getDepositRateFor(IVault vault) external view override returns (uint256 rate) {
    address cTokenAddr = _getCToken(vault.asset());

    // Block Rate transformed for common mantissa for Fuji in ray (1e27), Note: Compound uses base 1e18
    uint256 bRateperBlock = ICToken(cTokenAddr).supplyRatePerBlock() * 10 ** 9;

    // The approximate number of blocks per year that is assumed by the Compound interest rate model
    // aligned with Hundred finance
    uint256 blocksperYear = 15017140;
    rate = bRateperBlock * blocksperYear;
  }

  /// @inheritdoc ILendingProvider
  function getBorrowRateFor(IVault vault) external view override returns (uint256 rate) {
    address cTokenAddr = _getCToken(vault.debtAsset());

    // Block Rate transformed for common mantissa for Fuji in ray (1e27), Note: Compound uses base 1e18
    uint256 bRateperBlock = ICToken(cTokenAddr).borrowRatePerBlock() * 10 ** 9;

    // The approximate number of blocks per year that is assumed by the Compound interest rate model
    // aligned with Hundred finance
    uint256 blocksperYear = 15017140;
    rate = bRateperBlock * blocksperYear;
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
    address asset = vault.asset();
    ICToken cToken = ICToken(_getCToken(asset));
    balance = LibCompoundV2.viewUnderlyingBalanceOf(cToken, user);
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
    address asset = vault.debtAsset();
    ICToken cToken = ICToken(_getCToken(asset));
    balance = LibCompoundV2.viewBorrowingBalanceOf(cToken, user);
  }
}
