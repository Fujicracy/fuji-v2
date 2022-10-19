import { ChainAnkrKey, ChainCoingeckoKey, ChainId } from '../enums';

export const CHAIN: Record<
  ChainId,
  { coingecko: ChainCoingeckoKey; ankr: ChainAnkrKey }
> = {
  [ChainId.ETHEREUM]: {
    coingecko: ChainCoingeckoKey.ETHEREUM,
    ankr: ChainAnkrKey.ETHEREUM,
  },
  [ChainId.GOERLI]: {
    coingecko: ChainCoingeckoKey.GOERLI,
    ankr: ChainAnkrKey.GOERLI,
  },
  [ChainId.MATIC]: {
    coingecko: ChainCoingeckoKey.MATIC,
    ankr: ChainAnkrKey.MATIC,
  },
  [ChainId.MATIC_MUMBAI]: {
    coingecko: ChainCoingeckoKey.MATIC_MUMBAI,
    ankr: ChainAnkrKey.MATIC_MUMBAI,
  },
  [ChainId.FANTOM]: {
    coingecko: ChainCoingeckoKey.FANTOM,
    ankr: ChainAnkrKey.FANTOM,
  },
  [ChainId.ARBITRUM]: {
    coingecko: ChainCoingeckoKey.ARBITRUM,
    ankr: ChainAnkrKey.ARBITRUM,
  },
  [ChainId.OPTIMISM]: {
    coingecko: ChainCoingeckoKey.OPTIMISM,
    ankr: ChainAnkrKey.OPTIMISM,
  },
  [ChainId.OPTIMISM_GOERLI]: {
    coingecko: ChainCoingeckoKey.OPTIMISM_GOERLI,
    ankr: ChainAnkrKey.OPTIMISM_GOERLI,
  },
};
