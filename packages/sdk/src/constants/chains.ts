import { ChainId, ChainKey } from '../enums';

export const CHAIN: Record<ChainId, ChainKey> = {
  [ChainId.ETHEREUM]: ChainKey.ETHEREUM,
  [ChainId.GOERLI]: ChainKey.GOERLI,
  [ChainId.MATIC]: ChainKey.MATIC,
  [ChainId.MATIC_MUMBAI]: ChainKey.MATIC_MUMBAI,
  [ChainId.FANTOM]: ChainKey.FANTOM,
  [ChainId.ARBITRUM]: ChainKey.ARBITRUM,
  [ChainId.OPTIMISM]: ChainKey.OPTIMISM,
  [ChainId.OPTIMISM_GOERLI]: ChainKey.OPTIMISM_GOERLI,
};
