import { ChainAnkrKey, ChainCoingeckoKey, ChainId } from '../enums';
import { ChainLlamaKey } from '../enums/ChainKey';

export const CHAIN: Record<
  ChainId,
  { coingecko: ChainCoingeckoKey; ankr: ChainAnkrKey; llama: ChainLlamaKey }
> = {
  [ChainId.ETHEREUM]: {
    coingecko: ChainCoingeckoKey.ETHEREUM,
    ankr: ChainAnkrKey.ETHEREUM,
    llama: ChainLlamaKey.ETHEREUM,
  },
  [ChainId.GOERLI]: {
    coingecko: ChainCoingeckoKey.GOERLI,
    ankr: ChainAnkrKey.GOERLI,
    llama: ChainLlamaKey.ETHEREUM,
  },
  [ChainId.MATIC]: {
    coingecko: ChainCoingeckoKey.MATIC,
    ankr: ChainAnkrKey.MATIC,
    llama: ChainLlamaKey.MATIC,
  },
  [ChainId.MATIC_MUMBAI]: {
    coingecko: ChainCoingeckoKey.MATIC_MUMBAI,
    ankr: ChainAnkrKey.MATIC_MUMBAI,
    llama: ChainLlamaKey.MATIC,
  },
  [ChainId.FANTOM]: {
    coingecko: ChainCoingeckoKey.FANTOM,
    ankr: ChainAnkrKey.FANTOM,
    llama: ChainLlamaKey.FANTOM,
  },
  [ChainId.ARBITRUM]: {
    coingecko: ChainCoingeckoKey.ARBITRUM,
    ankr: ChainAnkrKey.ARBITRUM,
    llama: ChainLlamaKey.ARBITRUM,
  },
  [ChainId.OPTIMISM]: {
    coingecko: ChainCoingeckoKey.OPTIMISM,
    ankr: ChainAnkrKey.OPTIMISM,
    llama: ChainLlamaKey.OPTIMISM,
  },
  [ChainId.OPTIMISM_GOERLI]: {
    coingecko: ChainCoingeckoKey.OPTIMISM_GOERLI,
    ankr: ChainAnkrKey.OPTIMISM_GOERLI,
    llama: ChainLlamaKey.OPTIMISM,
  },
};
