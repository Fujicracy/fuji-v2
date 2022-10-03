import { ChainId } from '../enums';
import { ChainTokenList } from '../types';
import { USDC } from './tokens';

export const DEBT_LIST: ChainTokenList = {
  [ChainId.ETHEREUM]: [],
  [ChainId.GOERLI]: [USDC[ChainId.GOERLI]],
  [ChainId.MATIC]: [],
  [ChainId.MATIC_MUMBAI]: [USDC[ChainId.MATIC_MUMBAI]],
  [ChainId.FANTOM]: [],
  [ChainId.ARBITRUM]: [],
  [ChainId.OPTIMISM]: [],
  [ChainId.OPTIMISM_GOERLI]: [USDC[ChainId.OPTIMISM_GOERLI]],
};
