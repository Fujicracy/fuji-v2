// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

contract MockOracle {
  function getPriceOf(address _currencyAsset, address _commodityAsset, uint8 _decimals)
    external
    pure
    returns (uint256 price)
  {
    _currencyAsset;
    _commodityAsset;
    _decimals;
    price = 1e18;
  }
}
