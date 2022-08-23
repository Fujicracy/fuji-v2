// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

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
