// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title IronBankOptimism
 *
 * @author Fujidao Labs
 *
 * @notice This contract allows interaction with IronBank .
 *
 * @dev The IAddrMapper needs to be properly configured for IronBank.
 */

import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IAddrMapper} from "../../interfaces/IAddrMapper.sol";
import {IComptroller} from "../../interfaces/compoundV2/IComptroller.sol";
import {ICERC20} from "../../interfaces/compoundV2/ICERC20.sol";
import {ICToken} from "../../interfaces/compoundV2/ICToken.sol";
import {ICERC20} from "../../interfaces/compoundV2/ICERC20.sol";
import {IWETH9} from "../../abstracts/WETH9.sol";
import {LibIronBankOptimism} from "../../libraries/LibIronBankOptimism.sol";

contract IronBankOptimism is ILendingProvider {
  /// @dev Custom errors
  error IronBank__deposit_failed(uint256 status);
  error IronBank__payback_failed(uint256 status);
  error IronBank__withdraw_failed(uint256 status);
  error IronBank__borrow_failed(uint256 status);

  /**
   * @dev Returns true/false wether the given 'token' is/isn't WETH.
   *
   * @param token address of the 'token'
   */
  function _isWETH(address token) internal pure returns (bool) {
    return token == 0x4200000000000000000000000000000000000006;
  }

  /**
   * @dev Returns the {IAddrMapper} on this chain.
   */
  function _getAddrmapper() internal pure returns (IAddrMapper) {
    // TODO Define final address after deployment strategy is set.
    return IAddrMapper(0x4cB46032e2790D8CA10be6d0001e8c6362a76adA);
  }

  /**
   * @param asset address of the token to be used as collateral/debt.
   *
   * @dev Returns IronBank's underlying {ICToken} associated with the 'asset' to interact with IronBank.
   */
  function _getCyToken(address asset) internal view returns (address cToken) {
    cToken = _getAddrmapper().getAddressMapping("IronBank", asset);
  }

  /**
   * @dev Returns the Controller address of IronBank.
   */
  function _getComptrollerAddress() internal pure returns (address) {
    return 0xE0B57FEEd45e7D908f2d0DaCd26F113Cf26715BF;
  }

  /**
   * @param _cyTokenAddress address of the asset to be approved as collateral.
   *
   * @dev Approves vault's assets as collateral for IronBank Protocol.
   */
  function _enterCollatMarket(address _cyTokenAddress) internal {
    // Create a reference to the corresponding network Comptroller
    IComptroller comptroller = IComptroller(_getComptrollerAddress());

    address[] memory cyTokenMarkets = new address[](1);
    cyTokenMarkets[0] = _cyTokenAddress;
    comptroller.enterMarkets(cyTokenMarkets);
  }

  /// @inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "IronBank_Optimism";
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
    operator = _getCyToken(keyAsset);
  }

  /// @inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.asset();
    //Get cyToken address from mapping
    address cyTokenAddr = _getCyToken(asset);

    //Enter and/or ensure collateral market is enacted
    _enterCollatMarket(cyTokenAddr);

    // Create a reference to the cyToken contract
    ICERC20 cyToken = ICERC20(cyTokenAddr);

    // IronBank Protocol mints cyTokens, throw error if not
    uint256 status = cyToken.mint(amount);
    if (status != 0) {
      revert IronBank__deposit_failed(status);
    }
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.debtAsset();

    //Get cyToken address from mapping
    address cyTokenAddr = _getCyToken(asset);

    // Create a reference to the corresponding cyToken contract
    ICToken cyToken = ICToken(cyTokenAddr);

    //IronBank Protocol Borrow Process, throw errow if not.
    uint256 status = cyToken.borrow(amount);

    if (status != 0) {
      revert IronBank__borrow_failed(status);
    }
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.asset();
    //Get cyToken address from mapping
    address cyTokenAddr = _getCyToken(asset);

    // Create a reference to the corresponding cyToken contract
    ICToken cyToken = ICToken(cyTokenAddr);

    //IronBank Protocol Redeem Process, throw errow if not.
    uint256 status = cyToken.redeemUnderlying(amount);

    if (status != 0) {
      revert IronBank__withdraw_failed(status);
    }
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    address asset = vault.debtAsset();

    //Get cyToken address from mapping
    address cyTokenAddr = _getCyToken(asset);

    // Create a reference to the corresponding cyToken contract
    ICERC20 cyToken = ICERC20(cyTokenAddr);

    uint256 status = cyToken.repayBorrow(amount);

    if (status != 0) {
      revert IronBank__payback_failed(status);
    }
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function getDepositRateFor(IVault vault) external view override returns (uint256 rate) {
    address asset = vault.asset();
    address cyTokenAddr = _getCyToken(asset);

    // Block rate transformed for common mantissa for Fuji in ray (1e27)
    // Note: Compound uses base 1e18
    uint256 ratePerBlock = ICToken(cyTokenAddr).supplyRatePerBlock() * 10 ** 9;

    // 2102400 is the approx. number of blocks per year that's
    // assumed by the Compound V2 interest rate model
    rate = ratePerBlock * 2102400;
  }

  /// @inheritdoc ILendingProvider
  function getBorrowRateFor(IVault vault) external view override returns (uint256 rate) {
    address asset = vault.debtAsset();
    address cyTokenAddr = _getCyToken(asset);

    // Block rate transformed for common mantissa for Fuji in ray (1e27)
    // Note: Compound uses base 1e18
    uint256 ratePerBlock = ICToken(cyTokenAddr).borrowRatePerBlock() * 10 ** 9;

    // 2102400 is the approx. number of blocks per year that's
    // assumed by the Compound V2 interest rate model
    rate = ratePerBlock * 2102400;
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
    ICToken cyToken = ICToken(_getCyToken(asset));
    balance = LibIronBankOptimism.viewUnderlyingBalanceOf(cyToken, user);
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
    ICToken cyToken = ICToken(_getCyToken(asset));
    balance = LibIronBankOptimism.viewBorrowingBalanceOf(cyToken, user);
  }
}
