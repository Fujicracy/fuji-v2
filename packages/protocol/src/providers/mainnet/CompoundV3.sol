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
 * See `_getCometMarketFromContext`.
 */
contract CompoundV3 is ILendingProvider {
  error CompoundV3__IAddrMapperMisconfigured();
  error CompoundV3__callerIsNotaIVault();

  // Allows determining the context of the call.
  address private immutable _this;

  constructor() {
    _this = address(this);
  }

  function _getMappingAddr() internal pure returns (address) {
    // TODO Define final address after deployment strategy is set.
    return 0x5817437D2252A31EF315963289e5270811637dEb;
  }

  /// inheritdoc ILendingProvider
  function approvedOperator(address asset) external view returns (address operator) {
    address caller = msg.sender;
    try IVault(caller).debtAsset() returns (address debtAsset_) {
      address asset_ = IVault(caller).asset();
      operator = IAddrMapper(_getMappingAddr()).addressMapping(asset_, debtAsset_);
    } catch {
      operator = IAddrMapper(_getMappingAddr()).addressMapping(asset, address(0));
    }
  }

  /// inheritdoc ILendingProvider
  function deposit(address asset, uint256 amount) external returns (bool success) {
    ICompoundV3 cAssetV3 = _getCometMarketFromContext(asset);
    cAssetV3.supply(asset, amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function borrow(address asset, uint256 amount) external returns (bool success) {
    ICompoundV3 cAssetV3 = _getCometMarketFromContext(asset);
    // From Comet docs: "The base asset can be borrowed using the withdraw function"
    cAssetV3.withdraw(asset, amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function withdraw(address asset, uint256 amount) external returns (bool success) {
    ICompoundV3 cAssetV3 = _getCometMarketFromContext(asset);
    cAssetV3.withdraw(asset, amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function payback(address asset, uint256 amount) external returns (bool success) {
    ICompoundV3 cAssetV3 = _getCometMarketFromContext(asset);
    // From Coment docs: 'supply' the base asset to repay an open borrow of the base asset.
    cAssetV3.supply(asset, amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function getDepositRateFor(address asset) external view returns (uint256 rate) {
    ICompoundV3 cAssetV3 = _getCometMarketFromContext(asset);
    if (asset != cAssetV3.baseToken()) {
      rate = 0;
    } else {
      uint256 utilization = cAssetV3.getUtilization();
      // Scaled by 1e9 to return ray(1e27) per ILendingProvider specs, Compound uses base 1e18 number.
      uint256 ratePerSecond = cAssetV3.getSupplyRate(utilization) * 10 ** 9;
      // 31536000 seconds in a `year` = 60 * 60 * 24 * 365.
      rate = ratePerSecond * 31536000;
    }
  }

  /// inheritdoc ILendingProvider
  function getBorrowRateFor(address asset) external view returns (uint256 rate) {
    ICompoundV3 cAssetV3 = _getCometMarketFromContext(asset);
    if (asset != cAssetV3.baseToken()) {
      rate = 0;
    } else {
      uint256 utilization = cAssetV3.getUtilization();
      // Scaled by 1e9 to return ray(1e27) per ILendingProvider specs, Compound uses base 1e18 number.
      uint256 ratePerSecond = cAssetV3.getSupplyRate(utilization) * 10 ** 9;
      // 31536000 seconds in a `year` = 60 * 60 * 24 * 365.
      rate = ratePerSecond * 31536000;
    }
  }

  /// inheritdoc ILendingProvider
  function getDepositBalance(address asset, address user) external view returns (uint256 balance) {
    // `user` must be a Vault in this provider.
    ICompoundV3 cAssetV3 = _getCometMarketFromContext(asset, user);
    return cAssetV3.collateralBalanceOf(user, asset);
  }

  /// inheritdoc ILendingProvider
  function getBorrowBalance(address asset, address user) external view returns (uint256 balance) {
    // `user` must be a Vault in this provider.
    ICompoundV3 cAssetV3 = _getCometMarketFromContext(asset, user);
    return cAssetV3.borrowBalanceOf(user);
  }

  /**
   * @dev Determines call context and returns corresponding Comet Market
   * IAddrMapper must be properly configured, see below:
   *
   * If context is delegate called and a {BorrowingVault}:
   * - SHOULD return market {IAddrMapper.addressMapping(asset_, debtAsset_)}
   * in where Comet.baseToken == IVault.debtAsset(), and IVault.debtAsset() != address(0).
   * Else if context is delegate called and a {LendingVault}:
   * - SHOULD return market {IAddrMapper.addressMapping(asset_, debtAsset_)}
   * in where Comet.baseToken == IVault.asset(), and IVault.debtAsset() == address(0).
   * Else if context is NOT delegate called:
   * - SHOULD return market {IAddrMapper.addressMapping(asset_, address(0))}
   * in where Comet.baseToken == 'asset_'
   */
  function _getCometMarketFromContext(address asset) private view returns (ICompoundV3 cAssetV3) {
    address delegateCaller = address(this);
    if (_isDelegate() && _isABorrowingVault(delegateCaller)) {
      address asset_ = IVault(delegateCaller).asset();
      address debtAsset_ = IVault(delegateCaller).debtAsset();
      address market = IAddrMapper(_getMappingAddr()).addressMapping(asset_, debtAsset_);
      cAssetV3 = ICompoundV3(market);
    } else {
      address market = IAddrMapper(_getMappingAddr()).addressMapping(asset, address(0));
      cAssetV3 = ICompoundV3(market);
    }
  }

  /**
   * @dev Returns corresponding Comet Market from passed `vault` address.
   * See '_getCometMarketFromContext(address asset)' for IAddrMapper config specs.
   * - `vault` MUST be comply to IVault.
   */
  function _getCometMarketFromContext(address asset, address vault)
    private
    view
    returns (ICompoundV3 cAssetV3)
  {
    if (_isABorrowingVault(vault)) {
      address asset_ = IVault(vault).asset();
      address debtAsset_ = IVault(vault).debtAsset();
      address market = IAddrMapper(_getMappingAddr()).addressMapping(asset_, debtAsset_);
      cAssetV3 = ICompoundV3(market);
    } else {
      address market = IAddrMapper(_getMappingAddr()).addressMapping(asset, address(0));
      cAssetV3 = ICompoundV3(market);
    }
  }

  function _isDelegate() private view returns (bool check) {
    if (address(this) != _this) {
      // This is a call address(this) is this contract
      // We are executing in an external context.
      check = true;
    }
  }

  function _isABorrowingVault(address callingVault) private view returns (bool check) {
    try IVault(callingVault).debtAsset() returns (address debtAsset_) {
      if (debtAsset_ != address(0)) {
        check = true;
      }
    } catch {
      revert CompoundV3__callerIsNotaIVault();
    }
  }
}
