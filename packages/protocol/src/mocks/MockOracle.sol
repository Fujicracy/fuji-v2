// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {IFujiOracle} from "../interfaces/IFujiOracle.sol";

contract MockOracle is IFujiOracle {
  mapping(address => mapping(address => uint256)) public prices;

  function getPriceOf(address currencyAsset, address commodityAsset, uint8 decimals)
    external
    view
    returns (uint256 price)
  {
    uint256 p = prices[currencyAsset][commodityAsset];

    price = 10 ** uint256(decimals);

    if (commodityAsset != address(0)) {
      price = price * p;
    } else {
      price = price * (10 ** 8);
    }

    if (currencyAsset != address(0)) {
      price = price / p;
    } else {
      price = price / (10 ** 8);
    }
  }

  function setPriceOf(address currencyAsset, address commodityAsset, uint256 price) public {
    prices[currencyAsset][commodityAsset] = price;
  }
}
