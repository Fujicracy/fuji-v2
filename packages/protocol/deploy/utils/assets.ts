export const ASSETS: {
  [index: string]: {
    [index: string]: { address: string; oracle: string; decimals: number };
  };
} = {
  mainnet: {
    ETH: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      oracle: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      decimals: 18,
    },
    WETH: {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      oracle: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      decimals: 18,
    },
    USDC: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      oracle: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
      decimals: 6,
    },
  },
  goerli: {
    ETH: {
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      oracle: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e',
      decimals: 18,
    },
    WETH: {
      address: '0x2e3A2fb8473316A02b8A297B982498E661E1f6f5', // AaveV3-Goerli-Testnet-WETH
      oracle: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e',
      decimals: 18,
    },
    USDC: {
      address: '0xA2025B15a1757311bfD68cb14eaeFCc237AF5b43', // AaveV3-Goerli-Testnet-USDC
      oracle: '0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7',
      decimals: 6,
    },
  },
};
