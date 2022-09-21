// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ICompoundV3} from "../../interfaces/compoundV3/ICompoundV3.sol";
import {IAddrMapper} from "../../interfaces/IAddrMapper.sol";

/**
 * @title CompoundV3 Lending Provider.
 * @author Fujidao Labs
 * @notice This contract allows interaction with CompoundV3.
 * @dev The IAddrMapper needs to be properly configured for CompoundV3
 * See `_getCometMarket`.
 */
contract CompoundV3 is ILendingProvider {
  // Custom errors
  error CompoundV3__IAddrMapperMisconfigured();
  error CompoundV3__callerIsNotaIVault();
  error CompoundV3__invalidInput();
  error CompoundV3__wrongMarket();

  // Allows determining the context of the call.
  address private immutable _this;

  constructor() {
    _this = address(this);
  }

  /**
   * @notice Returns the {AddrMapper} contract applicable to this provider.
   */
  function getMapper() public pure returns (address) {
    // TODO Define final address after deployment strategy is set.
    return 0x193333b5B4642D2ABA72Fa4888c54202Ae125DCb;
  }

  /**
   * @notice Refer to {ILendingProvider-approveOperator}.
   * @dev `helper` address is used for `vault` in CompoundV3 Provider.
   */
  function approvedOperator(address, address vault) external view returns (address operator) {
    if (vault == address(0)) {
      revert CompoundV3__invalidInput();
    }
    IVault ivault = IVault(vault);
    address asset_ = ivault.asset();
    address debtAsset_ = ivault.debtAsset();
    operator = IAddrMapper(getMapper()).getAddressNestedMapping(asset_, debtAsset_);
  }

  /// inheritdoc ILendingProvider
  function deposit(address asset, uint256 amount, IVault vault) external returns (bool success) {
    ICompoundV3 cMarketV3 = _getCometMarket(vault);
    cMarketV3.supply(asset, amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function borrow(address asset, uint256 amount, IVault vault) external returns (bool success) {
    ICompoundV3 cMarketV3 = _getCometMarket(vault);
    // From Comet docs: "The base asset can be borrowed using the withdraw function"
    cMarketV3.withdraw(asset, amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function withdraw(address asset, uint256 amount, IVault vault) external returns (bool success) {
    ICompoundV3 cMarketV3 = _getCometMarket(vault);
    cMarketV3.withdraw(asset, amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function payback(address asset, uint256 amount, IVault vault) external returns (bool success) {
    ICompoundV3 cMarketV3 = _getCometMarket(vault);
    // From Coment docs: 'supply' the base asset to repay an open borrow of the base asset.
    cMarketV3.supply(asset, amount);
    success = true;
  }

  /**
   * @notice Refer to {ILendingProvider-getDepositRateFor}.
   * @dev `helper` address is used as `market` in CompoundV3 Provider.
   * You can obtain `market` from `getMapper()` seperately.
   */
  function getDepositRateFor(address asset, address market) external view returns (uint256 rate) {
    if (market == address(0)) {
      revert CompoundV3__invalidInput();
    }
    ICompoundV3 cMarketV3 = ICompoundV3(market);

    if (asset == cMarketV3.baseToken()) {
      uint256 utilization = cMarketV3.getUtilization();
      // Scaled by 1e9 to return ray(1e27) per ILendingProvider specs, Compound uses base 1e18 number.
      uint256 ratePerSecond = cMarketV3.getSupplyRate(utilization) * 10 ** 9;
      // 31536000 seconds in a `year` = 60 * 60 * 24 * 365.
      rate = ratePerSecond * 31536000;
    } else {
      rate = 0;
    }
  }

  /**
   * @notice Refer to {ILendingProvider-getBorrowRateFor}.
   * @dev `helper` address is used as `market` in CompoundV3 Provider.
   * You can obtain `market` from `getMapper()` seperately.
   */
  function getBorrowRateFor(address asset, address market) external view returns (uint256 rate) {
    if (market == address(0)) {
      revert CompoundV3__invalidInput();
    }
    ICompoundV3 cMarketV3 = ICompoundV3(market);

    if (asset == cMarketV3.baseToken()) {
      uint256 utilization = cMarketV3.getUtilization();
      // Scaled by 1e9 to return ray(1e27) per ILendingProvider specs, Compound uses base 1e18 number.
      uint256 ratePerSecond = cMarketV3.getBorrowRate(utilization) * 10 ** 9;
      // 31536000 seconds in a `year` = 60 * 60 * 24 * 365.
      rate = ratePerSecond * 31536000;
    } else {
      revert CompoundV3__wrongMarket();
    }
  }

  /**
   * @notice Refer to {ILendingProvider-getDepositBalance}.
   * @dev `helper` address is used as `vault` address in CompoundV3 Provider.
   * The `vault` address is used to obtain the applicable CompoundV3 market.
   * The market address cannot be provided directly since this function is also
   * called within a vault context. Therefore, there is no way to determine the market
   * from within the vault's logic.
   */
  function getDepositBalance(address asset, address user, address vault)
    external
    view
    returns (uint256 balance)
  {
    if (vault == address(0)) {
      revert CompoundV3__invalidInput();
    }
    ICompoundV3 cMarketV3 = _getCometMarket(IVault(vault));
    return cMarketV3.collateralBalanceOf(user, asset);
  }

  /**
   * @notice Refer to {ILendingProvider-getBorrowBalance}.
   * @dev `helper` address is used as `vault` address in CompoundV3 Provider.
   * The `vault` address is used to obtain the applicable CompoundV3 market.
   * The market address cannot be provided directly since this function is also
   * called within a vault context. Therefore, there is no way to determine the market
   * from within the vault's logic.
   */
  function getBorrowBalance(address asset, address user, address vault)
    external
    view
    returns (uint256 balance)
  {
    if (vault == address(0)) {
      revert CompoundV3__invalidInput();
    }
    ICompoundV3 cMarketV3 = _getCometMarket(IVault(vault));
    if (asset == cMarketV3.baseToken()) {
      balance = cMarketV3.borrowBalanceOf(user);
    }
  }

  /**
   * @dev Returns corresponding Comet Market from passed `vault` address.
   * IAddrMapper must be properly configured, see below:
   *
   * If `vault` is a {BorrowingVault}:
   * - SHOULD return market {IAddrMapper.addressMapping(asset_, debtAsset_)}
   * in where:
   * - Comet.baseToken() == IVault.debtAsset(), and IVault.debtAsset() != address(0).
   * Else if `vault` is a {YieldVault}:
   * - SHOULD return market {IAddrMapper.addressMapping(asset_, debtAsset_)}
   * in where:
   * - Comet.baseToken() == IVault.asset(), and IVault.debtAsset() == address(0).
   */
  function _getCometMarket(IVault vault) private view returns (ICompoundV3 cMarketV3) {
    address asset_ = vault.asset();
    address debtAsset_ = vault.debtAsset();
    address market = IAddrMapper(getMapper()).getAddressNestedMapping(asset_, debtAsset_);
    cMarketV3 = ICompoundV3(market);
  }
}
