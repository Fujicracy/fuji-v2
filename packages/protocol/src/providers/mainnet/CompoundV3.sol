// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title CompoundV3
 *
 * @author Fujidao Labs
 *
 * @notice This contract allows interaction with CompoundV3.
 *
 * @dev The IAddrMapper needs to be properly configured for CompoundV3.
 * See `_getMarketAndAssets`.
 */

import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IHarvestable} from "../../interfaces/IHarvestable.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ICompoundV3} from "../../interfaces/compoundV3/ICompoundV3.sol";
import {
  ICompoundV3Rewards,
  RewardOwed,
  RewardConfig
} from "../../interfaces/compoundV3/ICompoundV3Rewards.sol";
import {IAddrMapper} from "../../interfaces/IAddrMapper.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";

contract CompoundV3 is ILendingProvider, IHarvestable {
  using Math for uint256;

  /// @dev Custom errors
  error CompoundV3__wrongMarket();

  /**
   * @notice Returns the {AddrMapper} contract applicable to this provider.
   */
  function getMapper() public pure returns (IAddrMapper) {
    // TODO Define final address after deployment strategy is set.
    return IAddrMapper(0x529eE84BFE4F37132f5f9599d4cc4Ff16Ee6d0D2);
  }

  /// @inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "Compound_V3";
  }

  /// @inheritdoc ILendingProvider
  function approvedOperator(
    address,
    address asset,
    address debtAsset
  )
    external
    view
    returns (address operator)
  {
    operator = getMapper().getAddressNestedMapping(providerName(), asset, debtAsset);
  }

  /// @inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external returns (bool success) {
    (ICompoundV3 cMarketV3, address asset,) = _getMarketAndAssets(vault);
    cMarketV3.supply(asset, amount);
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external returns (bool success) {
    (ICompoundV3 cMarketV3,, address debtAsset) = _getMarketAndAssets(vault);
    // From Comet docs: "The base asset can be borrowed using the withdraw function"
    cMarketV3.withdraw(debtAsset, amount);
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external returns (bool success) {
    (ICompoundV3 cMarketV3, address asset,) = _getMarketAndAssets(vault);
    cMarketV3.withdraw(asset, amount);
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external returns (bool success) {
    (ICompoundV3 cMarketV3,, address debtAsset) = _getMarketAndAssets(vault);
    // From Coment docs: 'supply' the base asset to repay an open borrow of the base asset.
    cMarketV3.supply(debtAsset, amount);
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function getDepositRateFor(IVault vault) external view returns (uint256 rate) {
    (ICompoundV3 cMarketV3, address asset,) = _getMarketAndAssets(vault);

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

  /// @inheritdoc ILendingProvider
  function getBorrowRateFor(IVault vault) external view returns (uint256 rate) {
    (ICompoundV3 cMarketV3,, address debtAsset) = _getMarketAndAssets(vault);

    if (debtAsset == cMarketV3.baseToken()) {
      uint256 utilization = cMarketV3.getUtilization();
      // Scaled by 1e9 to return ray(1e27) per ILendingProvider specs, Compound uses base 1e18 number.
      uint256 ratePerSecond = cMarketV3.getBorrowRate(utilization) * 10 ** 9;
      // 31536000 seconds in a `year` = 60 * 60 * 24 * 365.
      rate = ratePerSecond * 31536000;
    } else {
      revert CompoundV3__wrongMarket();
    }
  }

  /// @inheritdoc ILendingProvider
  function getDepositBalance(address user, IVault vault) external view returns (uint256 balance) {
    (ICompoundV3 cMarketV3, address asset,) = _getMarketAndAssets(vault);
    if (asset == cMarketV3.baseToken()) {
      balance = cMarketV3.balanceOf(user);
    } else {
      balance = cMarketV3.collateralBalanceOf(user, asset);
    }
  }

  /// @inheritdoc ILendingProvider
  function getBorrowBalance(address user, IVault vault) external view returns (uint256 balance) {
    (ICompoundV3 cMarketV3,, address debtAsset) = _getMarketAndAssets(vault);
    if (debtAsset == cMarketV3.baseToken()) {
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
  function _getMarketAndAssets(IVault vault)
    private
    view
    returns (ICompoundV3 cMarketV3, address asset, address debtAsset)
  {
    asset = vault.asset();
    debtAsset = vault.debtAsset();
    address market = getMapper().getAddressNestedMapping(providerName(), asset, debtAsset);

    cMarketV3 = ICompoundV3(market);
  }

  function _getRewards() private pure returns (ICompoundV3Rewards compoundV3Rewards) {
    compoundV3Rewards = ICompoundV3Rewards(0x1B0e765F6224C21223AeA2af16c1C46E38885a40);
  }

  /// @inheritdoc IHarvestable
  function harvest(bytes memory data)
    external
    returns (address[] memory tokens, uint256[] memory amounts)
  {
    IVault vault = abi.decode(data, (IVault));
    (ICompoundV3 cMarketV3,,) = _getMarketAndAssets(vault);

    RewardOwed memory rewardOwed = _getRewards().getRewardOwed(address(cMarketV3), address(vault));
    tokens = new address[](1);
    tokens[0] = rewardOwed.token;

    amounts = new uint256[](1);
    amounts[0] = rewardOwed.owed.mulDiv(1, 10);

    _getRewards().claim(address(cMarketV3), address(vault), true);
  }

  ////TODO/ @inheritdoc IHarvestable
  /// @dev compound reward amounts are scaled by up by 10
  function previewHarvest(IVault vault)
    public
    view
    returns (address[] memory tokens, uint256[] memory amounts)
  {
    (ICompoundV3 cMarketV3,,) = _getMarketAndAssets(vault);
    RewardConfig memory rewardConfig = _getRewards().rewardConfig(address(cMarketV3));

    tokens = new address[](1);
    tokens[0] = rewardConfig.token;

    //TODO
    amounts = new uint256[](1);
    amounts[0] = 0;
  }
}
