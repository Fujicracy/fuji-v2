import { ChainId } from '../enums';
import { ChainKey } from '../enums';

export const CHAIN_KEY: { [chainId: number]: ChainKey } = {
  [ChainId.ETHEREUM]: ChainKey.ETHEREUM,
  [ChainId.GOERLI]: ChainKey.GOERLI,
  [ChainId.MATIC]: ChainKey.MATIC,
  [ChainId.MATIC_TESTNET]: ChainKey.MATIC_TESTNET,
  [ChainId.FANTOM]: ChainKey.FANTOM,
  [ChainId.XDAI]: ChainKey.XDAI,
  [ChainId.BSC]: ChainKey.BSC,
  [ChainId.BSC_TESTNET]: ChainKey.BSC_TESTNET,
  [ChainId.ARBITRUM]: ChainKey.ARBITRUM,
  [ChainId.ARBITRUM_TESTNET]: ChainKey.ARBITRUM_TESTNET,
  [ChainId.MOONBEAM_TESTNET]: ChainKey.MOONBEAM_TESTNET,
  [ChainId.AVALANCHE]: ChainKey.AVALANCHE,
  [ChainId.AVALANCHE_TESTNET]: ChainKey.AVALANCHE_TESTNET,
  [ChainId.CELO]: ChainKey.CELO,
  [ChainId.MOONRIVER]: ChainKey.MOONRIVER,
  [ChainId.FUSE]: ChainKey.FUSE,
  [ChainId.MOONBEAM]: ChainKey.MOONBEAM,
  [ChainId.OPTIMISM]: ChainKey.OPTIMISM,
  [ChainId.KAVA]: ChainKey.KAVA,
  [ChainId.METIS]: ChainKey.METIS,
  [ChainId.ARBITRUM_NOVA]: ChainKey.ARBITRUM_NOVA,
};
