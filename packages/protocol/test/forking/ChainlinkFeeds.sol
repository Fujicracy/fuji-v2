// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

/**
 * @title ChainlinkFeeds
 *
 * @author Fujidao Labs
 *
 * @notice Sets the chainlink price feeds for every chain to be able to use the {FujiOracle}.
 * @dev reference for chainlink oracle addresses: https://docs.chain.link/data-feeds/price-feeds/addresses
 *
 */

contract ChainlinkFeeds {
  // mapping(domain=>assets[])
  mapping(uint32 => address[]) assets;
  // mapping(domain=>chainlink oracle addresses)
  mapping(uint32 => address[]) priceFeeds;

  uint32 public constant MAINNET_DOMAIN = 6648936;
  uint32 public constant OPTIMISM_DOMAIN = 1869640809;
  uint32 public constant ARBITRUM_DOMAIN = 1634886255;
  uint32 public constant POLYGON_DOMAIN = 1886350457;
  uint32 public constant GNOSIS_DOMAIN = 6778479;
  //https://github.com/connext/chaindata/blob/main/crossChain.json

  constructor() {
    //0-weth, 1-usdc, 2-dai, 3-wmatic

    //MAINNET
    assets[MAINNET_DOMAIN] = [
      0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
      0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,
      0x6B175474E89094C44Da98b954EedeAC495271d0F,
      0x7c9f4C87d911613Fe9ca58b579f737911AAD2D43
    ];

    priceFeeds[MAINNET_DOMAIN] = [
      0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419,
      0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6,
      0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9,
      0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676
    ];

    //OPTIMISM
    assets[OPTIMISM_DOMAIN] = [
      0x4200000000000000000000000000000000000006,
      0x7F5c764cBc14f9669B88837ca1490cCa17c31607,
      0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1
    ];

    priceFeeds[OPTIMISM_DOMAIN] = [
      0x13e3Ee699D1909E989722E753853AE30b17e08c5,
      0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3,
      0x8dBa75e83DA73cc766A7e5a0ee71F656BAb470d6
    ];

    //ARBITRUM
    assets[ARBITRUM_DOMAIN] = [
      0x82aF49447D8a07e3bd95BD0d56f35241523fBab1,
      0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8,
      0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1
    ];

    priceFeeds[ARBITRUM_DOMAIN] = [
      0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612,
      0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3,
      0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB
    ];

    //POLYGON
    assets[POLYGON_DOMAIN] = [
      0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619,
      0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174,
      0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063,
      0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270
    ];

    priceFeeds[POLYGON_DOMAIN] = [
      0xF9680D99D6C9589e2a93a78A04A279e509205945,
      0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7,
      0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D,
      0xAB594600376Ec9fD91F8e885dADF0CE036862dE0
    ];

    //GNOSIS
    assets[GNOSIS_DOMAIN] = [
      0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1,
      0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83,
      0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d
    ];

    priceFeeds[GNOSIS_DOMAIN] = [
      0xa767f745331D267c7751297D982b050c93985627,
      0x26C31ac71010aF62E6B486D1132E266D6298857D,
      0x678df3415fc31947dA4324eC63212874be5a82f8
    ];
  }
}
