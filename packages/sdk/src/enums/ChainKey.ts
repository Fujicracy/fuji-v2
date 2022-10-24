// select a key from https://api.coingecko.com/api/v3/asset_platforms
export enum ChainCoingeckoKey {
  ARBITRUM = 'arbitrum-one',
  ETHEREUM = 'ethereum',
  FANTOM = 'fantom',
  GOERLI = 'goerli',
  MATIC = 'polygon-pos',
  MATIC_MUMBAI = 'matic-mumbai',
  OPTIMISM = 'optimistic-ethereum',
  OPTIMISM_GOERLI = 'optimism-goerli',
}

// refer to https://www.ankr.com/docs/advanced-api/overview/
export enum ChainAnkrKey {
  ARBITRUM = 'arbitrum',
  ETHEREUM = 'eth',
  FANTOM = 'fantom',
  GOERLI = 'eth_goerli',
  MATIC = 'polygon',
  MATIC_MUMBAI = 'polygon_mumbai',
  OPTIMISM = 'optimism',
  OPTIMISM_GOERLI = 'optimism_testnet',
}
