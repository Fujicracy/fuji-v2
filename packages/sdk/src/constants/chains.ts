import { ChainId } from '../enums';
import { ChainKey } from '../enums';

export const CHAIN: { [chainId: number]: ChainKey } = {
  [ChainId.ETHEREUM]: ChainKey.ETHEREUM,
  [ChainId.GOERLI]: ChainKey.GOERLI,
  [ChainId.MATIC]: ChainKey.MATIC,
  [ChainId.MATIC_MUMBAI]: ChainKey.MATIC_MUMBAI,
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
  [ChainId.OPTIMISM_GOERLI]: ChainKey.OPTIMISM_GOERLI,
  [ChainId.KAVA]: ChainKey.KAVA,
  [ChainId.METIS]: ChainKey.METIS,
  [ChainId.ARBITRUM_NOVA]: ChainKey.ARBITRUM_NOVA,
};
