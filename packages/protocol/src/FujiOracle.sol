// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {SystemAccessControl} from "./access/SystemAccessControl.sol";
import {IAggregatorV3} from "./interfaces/chainlink/IAggregatorV3.sol";
import {IFujiOracle} from "./interfaces/IFujiOracle.sol";

/**
 * @dev Contract that returns and computes prices for the Fuji protocol
 */

contract FujiOracle is IFujiOracle, SystemAccessControl {
  error FujiOracle__lengthMismatch();
  error FujiOracle__noZeroAddress();
  error FujiOracle__noPriceFeed();
  error FujiOracle_invalidPriceFeedDecimals(address priceFeed);

  // mapping from asset address to its price feed oracle in USD - decimals: 8
  mapping(address => address) public usdPriceFeeds;

  /**
   * @dev Initializes the contract setting '_priceFeeds' addresses for '_assets'
   */
  constructor(
    address[] memory assets,
    address[] memory priceFeeds,
    address chief_
  )
    SystemAccessControl(chief_)
  {
    if (assets.length != priceFeeds.length) {
      revert FujiOracle__lengthMismatch();
    }

    for (uint256 i = 0; i < assets.length; i++) {
      _validatePriceFeedDecimals(priceFeeds[i]);
      usdPriceFeeds[assets[i]] = priceFeeds[i];
    }
  }

  /**
   * @dev Sets '_priceFeed' address for a '_asset'.
   * Can only be called by the contract TIMELOCK_ADMIN_ROLE in {Chief}.
   * Emits a {AssetPriceFeedChanged} event.
   */
  function setPriceFeed(address asset, address priceFeed) public onlyTimelock {
    if (priceFeed == address(0)) {
      revert FujiOracle__noZeroAddress();
    }

    _validatePriceFeedDecimals(priceFeed);

    usdPriceFeeds[asset] = priceFeed;
    emit AssetPriceFeedChanged(asset, priceFeed);
  }

  /**
   * @dev Calculates the exchange rate between two assets, with price oracle given in specified decimals.
   * Format is: (currencyAsset per unit of commodityAsset Exchange Rate).
   * @param currencyAsset: the currency asset, zero-address for USD.
   * @param commodityAsset: the commodity asset, zero-address for USD.
   * @param decimals: the decimals of the price output.
   * Returns the exchange rate of the given pair.
   */
  function getPriceOf(
    address currencyAsset,
    address commodityAsset,
    uint8 decimals
  )
    external
    view
    override
    returns (uint256 price)
  {
    price = 10 ** uint256(decimals);

    if (commodityAsset != address(0)) {
      price = price * _getUSDPrice(commodityAsset);
    } else {
      price = price * (10 ** 8);
    }

    if (currencyAsset != address(0)) {
      price = price / _getUSDPrice(currencyAsset);
    } else {
      price = price / (10 ** 8);
    }
  }

  /**
   * @dev Returns the USD price of asset in a 8 decimal uint format.
   * @param asset: the asset address.
   */
  function _getUSDPrice(address asset) internal view returns (uint256 price) {
    if (usdPriceFeeds[asset] == address(0)) {
      revert FujiOracle__noPriceFeed();
    }

    (, int256 latestPrice,,,) = IAggregatorV3(usdPriceFeeds[asset]).latestRoundData();

    price = uint256(latestPrice);
  }

  function _validatePriceFeedDecimals(address priceFeed) internal view {
    if (IAggregatorV3(priceFeed).decimals() != 8) {
      revert FujiOracle_invalidPriceFeedDecimals(priceFeed);
    }
  }
}
