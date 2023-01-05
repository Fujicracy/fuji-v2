// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IAddrMapper} from "../../interfaces/IAddrMapper.sol";
import {IComptroller} from "../../interfaces/compoundV2/IComptroller.sol";
import {ICERC20} from "../../interfaces/compoundV2/ICERC20.sol";
import {ICToken} from "../../interfaces/compoundV2/ICToken.sol";
import {ICERC20} from "../../interfaces/compoundV2/ICERC20.sol";
import {IWETH9} from "../../abstracts/WETH9.sol";
import {LibCompoundV2} from "../../libraries/LibCompoundV2.sol";

/**
 * @title IronBank Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with IronBank .
 */
contract IronBank is ILendingProvider {
  error IronBank__deposit_failed(uint256 status);
  error IronBank__payback_failed(uint256 status);
  error IronBank__withdraw_failed(uint256 status);
  error IronBank__borrow_failed(uint256 status);

  function _isWETH(address token) internal pure returns (bool) {
    return token == 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  }

  function _getAddrmapper() internal pure returns (IAddrMapper) {
    // TODO Define final address after deployment strategy is set.
    return IAddrMapper(0x529eE84BFE4F37132f5f9599d4cc4Ff16Ee6d0D2);
  }

  function _getCyToken(address underlying) internal view returns (address cToken) {
    cToken = _getAddrmapper().getAddressMapping("IronBank", underlying);
  }

  //TODO check if its being used
  function _getComptrollerAddress() internal pure returns (address) {
    return 0xAB1c342C7bf5Ec5F02ADEA1c2270670bCa144CbB;
  }

  /**
   * @dev Approves vault's assets as collateral for IronBank Protocol.
   * @param _cyTokenAddress: asset type to be approved as collateral.
   */
  function _enterCollatMarket(address _cyTokenAddress) internal {
    // Create a reference to the corresponding network Comptroller
    IComptroller comptroller = IComptroller(_getComptrollerAddress());

    address[] memory cyTokenMarkets = new address[](1);
    cyTokenMarkets[0] = _cyTokenAddress;
    comptroller.enterMarkets(cyTokenMarkets);
  }

  /// inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "IronBank";
  }

  /// inheritdoc ILendingProvider
  function approvedOperator(
    address asset,
    address
  )
    external
    view
    override
    returns (address operator)
  {
    operator = _getCyToken(asset);
  }

  /// inheritdoc ILendingProvider
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

  /// inheritdoc ILendingProvider
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

  /// inheritdoc ILendingProvider
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

  /// inheritdoc ILendingProvider
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

  /// inheritdoc ILendingProvider
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

  /// inheritdoc ILendingProvider
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
    address asset = vault.asset();
    ICToken cyToken = ICToken(_getCyToken(asset));
    balance = LibCompoundV2.viewUnderlyingBalanceOf(cyToken, user);
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
    address asset = vault.debtAsset();
    ICToken cyToken = ICToken(_getCyToken(asset));
    balance = LibCompoundV2.viewBorrowingBalanceOf(cyToken, user);
  }
}
