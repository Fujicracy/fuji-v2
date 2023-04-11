import { ChainId } from '../enums';

export const CHAIN_NAME: Record<ChainId, string> = {
  [ChainId.ETHEREUM]: 'Ethereum',
  [ChainId.ARBITRUM]: 'Arbitrum',
  [ChainId.FANTOM]: 'Fantom',
  [ChainId.MATIC]: 'Polygon',
  [ChainId.OPTIMISM]: 'Optimism',
  [ChainId.GNOSIS]: 'Gnosis',
  [ChainId.GOERLI]: 'Goerli',
  [ChainId.OPTIMISM_GOERLI]: 'Optimism Goerli',
  [ChainId.MATIC_MUMBAI]: 'Mumbai',
};

export const CHAIN_BLOCK_EXPLORER_URL: Record<ChainId, string> = {
  [ChainId.ETHEREUM]: 'https://etherscan.io/',
  [ChainId.ARBITRUM]: 'https://arbiscan.io/',
  [ChainId.FANTOM]: 'https://ftmscan.com/',
  [ChainId.MATIC]: 'https://polygonscan.com/',
  [ChainId.OPTIMISM]: 'https://optimistic.etherscan.io/',
  [ChainId.GNOSIS]: 'https://gnosisscan.io/',
  [ChainId.GOERLI]: 'https://goerli.etherscan.io/',
  [ChainId.OPTIMISM_GOERLI]: 'https://goerli-optimism.etherscan.io/',
  [ChainId.MATIC_MUMBAI]: 'https://mumbai.polygonscan.com/',
};

// select a key from https://api.coingecko.com/api/v3/asset_platforms
export const CHAIN_COINGECKO_KEY: Record<ChainId, string> = {
  [ChainId.ETHEREUM]: 'ethereum',
  [ChainId.ARBITRUM]: 'arbitrum-one',
  [ChainId.FANTOM]: 'fantom',
  [ChainId.MATIC]: 'polygon-pos',
  [ChainId.OPTIMISM]: 'optimistic-ethereum',
  [ChainId.GNOSIS]: 'gnosis',
  [ChainId.GOERLI]: 'goerli',
  [ChainId.OPTIMISM_GOERLI]: 'optimism-goerli',
  [ChainId.MATIC_MUMBAI]: 'matic-mumbai',
};

export const CHAIN_LLAMA_KEY: Record<ChainId, string> = {
  [ChainId.ETHEREUM]: 'Ethereum',
  [ChainId.ARBITRUM]: 'Arbitrum',
  [ChainId.FANTOM]: 'Fantom',
  [ChainId.MATIC]: 'Polygon',
  [ChainId.OPTIMISM]: 'Optimism',
  [ChainId.GNOSIS]: 'gnosis',
  [ChainId.GOERLI]: 'Ethereum',
  [ChainId.OPTIMISM_GOERLI]: 'Optimism',
  [ChainId.MATIC_MUMBAI]: 'Polygon',
};
