import { ChainId } from '../enums';

export const CHAIN_LABEL: Record<ChainId, string> = {
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

export const CHAIN_NATIVE_TOKEN_NAME: Record<ChainId, string> = {
  [ChainId.ETHEREUM]: 'ETH',
  [ChainId.ARBITRUM]: 'AETH',
  [ChainId.FANTOM]: 'FTM',
  [ChainId.MATIC]: 'MATIC',
  [ChainId.OPTIMISM]: 'ETH',
  [ChainId.GNOSIS]: 'xDai',
  [ChainId.GOERLI]: 'GTH',
  [ChainId.OPTIMISM_GOERLI]: 'Optimism Goerli',
  [ChainId.MATIC_MUMBAI]: 'MATIC',
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
