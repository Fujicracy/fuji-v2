// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {IAggregatorV3} from "./interfaces/chainlink/IAggregatorV3.sol";
import {IFujiOracle} from "./interfaces/IFujiOracle.sol";

/**
 * @dev Contract that returns and computes prices for the Fuji protocol
 */

contract FujiOracle is IFujiOracle, Ownable {
  error FujiOracle__lengthMismatch();
  error FujiOracle__noZeroAddress();
  error FujiOracle__noPriceFeed();

  // mapping from asset address to its price feed oracle in USD - decimals: 8
  mapping(address => address) public usdPriceFeeds;

  /**
   * @dev Initializes the contract setting '_priceFeeds' addresses for '_assets'
   */
  constructor(address[] memory _assets, address[] memory _priceFeeds) {
    if (_assets.length != _priceFeeds.length) {
      revert FujiOracle__lengthMismatch();
    }

    for (uint256 i = 0; i < _assets.length; i++) {
      usdPriceFeeds[_assets[i]] = _priceFeeds[i];
    }
  }

  /**
   * @dev Sets '_priceFeed' address for a '_asset'.
   * Can only be called by the contract owner.
   * Emits a {AssetPriceFeedChanged} event.
   */
  function setPriceFeed(address _asset, address _priceFeed) public onlyOwner {
    if (_priceFeed == address(0)) {
      revert FujiOracle__noZeroAddress();
    }

    usdPriceFeeds[_asset] = _priceFeed;
    emit AssetPriceFeedChanged(_asset, _priceFeed);
  }

  /**
   * @dev Calculates the exchange rate between two assets, with price oracle given in specified decimals.
   * Format is: (_currencyAsset per unit of _commodityAsset Exchange Rate).
   * @param _currencyAsset: the currency asset, zero-address for USD.
   * @param _commodityAsset: the commodity asset, zero-address for USD.
   * @param _decimals: the decimals of the price output.
   * Returns the exchange rate of the given pair.
   */
  function getPriceOf(address _currencyAsset, address _commodityAsset, uint8 _decimals)
    external
    view
    override
    returns (uint256 price)
  {
    price = 10 ** uint256(_decimals);

    if (_commodityAsset != address(0)) {
      price = price * _getUSDPrice(_commodityAsset);
    } else {
      price = price * (10 ** 8);
    }

    if (_currencyAsset != address(0)) {
      price = price / _getUSDPrice(_currencyAsset);
    } else {
      price = price / (10 ** 8);
    }
  }

  /**
   * @dev Calculates the USD price of asset.
   * @param _asset: the asset address.
   * Returns the USD price of the given asset
   */
  function _getUSDPrice(address _asset) internal view returns (uint256 price) {
    if (usdPriceFeeds[_asset] == address(0)) {
      revert FujiOracle__noPriceFeed();
    }

    (, int256 latestPrice,,,) = IAggregatorV3(usdPriceFeeds[_asset]).latestRoundData();

    price = uint256(latestPrice);
  }
}
