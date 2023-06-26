// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title DForcePolygon
 *
 * @author Fujidao Labs
 *
 * @notice This contract allows interaction with DForce.
 *
 * @dev The IAddrMapper needs to be properly configured for DForce.
 */

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IAddrMapper} from "../../interfaces/IAddrMapper.sol";
import {IComptroller} from "../../interfaces/compoundV2/IComptroller.sol";
import {IGenIToken} from "../../interfaces/dforce/IGenIToken.sol";
import {IIERC20} from "../../interfaces/dforce/IIERC20.sol";
import {IIETH} from "../../interfaces/dforce/IIETH.sol";
import {IWETH9} from "../../abstracts/WETH9.sol";
import {LibDForce} from "../../libraries/LibDForce.sol";

contract DForcePolygon is ILendingProvider {
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
    return IAddrMapper(0xCC1cF8f5f32ce55B6E798c8122d841e957077C59);
  }

  /**
   * @dev Returns the Controller address of Hundred.
   */
  function _getControllerAddress() internal pure returns (address) {
    return 0x52eaCd19E38D501D006D2023C813d7E37F025f37; // dForce Polygon
  }

  /**
   * @dev Returns DForce's underlying {IGenToken} associated with the 'asset' to interact with DForce.
   *
   * @param asset address of the token to be used as collateral/debt.
   */
  function _getiToken(address asset) internal view returns (address iToken) {
    iToken = _getAddrmapper().getAddressMapping(providerName(), asset);
  }

  /**
   * @dev Approves vault's assets as collateral for dForce Protocol.
   *
   * @param _iTokenAddress address of the underlying {IGenToken} to be approved as collateral.   *
   */
  function _enterCollatMarket(address _iTokenAddress) internal {
    // Create a reference to the corresponding network Comptroller
    IComptroller controller = IComptroller(_getControllerAddress());

    address[] memory iTokenMarkets = new address[](1);
    iTokenMarkets[0] = _iTokenAddress;
    controller.enterMarkets(iTokenMarkets);
  }

  /// @inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "DForce_Polygon";
  }

  /// @inheritdoc ILendingProvider
  function approvedOperator(
    address keyAsset,
    address,
    address
  )
    external
    view
    returns (address operator)
  {
    operator = _getiToken(keyAsset);
  }

  /// @inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.asset();
    // Get iToken address from mapping
    address iTokenAddr = _getAddrmapper().getAddressMapping(providerName(), asset);

    // Enter and/or ensure collateral market is enacted
    _enterCollatMarket(iTokenAddr);

    if (_isWMATIC(asset)) {
      //unwrap WMATIC to MATIC
      IWETH9(asset).withdraw(amount);

      // Create a reference to the iToken contract
      IIETH iToken = IIETH(iTokenAddr);

      // dForce protocol Mints iTokens, MATIC method
      iToken.mint{value: amount}(address(this));
    } else {
      // Create a reference to the iToken contract
      IIERC20 iToken = IIERC20(iTokenAddr);

      // dForce Protocol mints iTokens
      iToken.mint(address(this), amount);
    }
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.debtAsset();
    // Get iToken address from mapping
    address iTokenAddr = _getAddrmapper().getAddressMapping(providerName(), asset);

    // Create a reference to the corresponding iToken contract
    IGenIToken iToken = IGenIToken(iTokenAddr);

    // dForce Protocol Borrow Process, throw errow if not.
    iToken.borrow(amount);

    if (_isWMATIC(asset)) {
      // wrap MATIC to MATIC
      IWETH9(asset).deposit{value: amount}();
    }
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.asset();
    // Get iToken address from mapping
    address iTokenAddr = _getAddrmapper().getAddressMapping(providerName(), asset);

    // Create a reference to the corresponding iToken contract
    IGenIToken iToken = IGenIToken(iTokenAddr);

    // dForce Protocol Redeem Process, throw errow if not.
    iToken.redeemUnderlying(address(this), amount);

    if (_isWMATIC(asset)) {
      // wrap MATIC to WMATIC
      IWETH9(asset).deposit{value: amount}();
    }
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.debtAsset();
    // Get iToken address from mapping
    address iTokenAddr = _getAddrmapper().getAddressMapping(providerName(), asset);

    if (_isWMATIC(asset)) {
      // Create a reference to the corresponding iToken contract
      IIETH iToken = IIETH(iTokenAddr);

      //unwrap WMATIC to MATIC
      IWETH9(asset).withdraw(amount);

      iToken.repayBorrow{value: amount}();
    } else {
      // Create a reference to the corresponding iToken contract
      IIERC20 iToken = IIERC20(iTokenAddr);

      iToken.repayBorrow(amount);
    }
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function getDepositRateFor(IVault vault) external view override returns (uint256 rate) {
    address iTokenAddr = _getAddrmapper().getAddressMapping(providerName(), vault.asset());

    // Block Rate transformed for common mantissa for Fuji in ray (1e27), Note: dForce uses base 1e18
    uint256 bRateperBlock = IGenIToken(iTokenAddr).supplyRatePerBlock() * 10 ** 9;

    // The approximate number of blocks per year that is assumed by the dForce interest rate model
    // aligned with Hundred finance
    uint256 blocksperYear = 15017140;
    return bRateperBlock * blocksperYear;
  }

  /// @inheritdoc ILendingProvider
  function getBorrowRateFor(IVault vault) external view override returns (uint256 rate) {
    address iTokenAddr = _getAddrmapper().getAddressMapping(providerName(), vault.debtAsset());

    // Block Rate transformed for common mantissa for Fuji in ray (1e27), Note: dForce uses base 1e18
    uint256 bRateperBlock = IGenIToken(iTokenAddr).borrowRatePerBlock() * 10 ** 9;

    // The approximate number of blocks per year that is assumed by the dForce interest rate model
    // aligned with Hundred finance
    uint256 blocksperYear = 15017140;
    return bRateperBlock * blocksperYear;
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
    IGenIToken iToken = IGenIToken(_getiToken(asset));
    balance = LibDForce.viewUnderlyingBalanceOf(iToken, user);
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
    IGenIToken iToken = IGenIToken(_getiToken(asset));
    balance = LibDForce.viewBorrowingBalanceOf(iToken, user);
  }

  /// @inheritdoc ILendingProvider
  function harvest(bytes memory /* data */ ) external pure returns (bool success) {
    return false;
  }
}
