import { ChainId } from '../enums';
import { ChainTokenList } from '../types';
import { USDC, WNATIVE } from './tokens';

export const COLLATERAL_LIST: ChainTokenList = {
  [ChainId.ETHEREUM]: [],
  [ChainId.GOERLI]: [WNATIVE[ChainId.GOERLI]],
  [ChainId.MATIC]: [],
  [ChainId.MATIC_MUMBAI]: [WNATIVE[ChainId.MATIC_MUMBAI]],
  [ChainId.FANTOM]: [],
  [ChainId.ARBITRUM]: [],
  [ChainId.OPTIMISM]: [],
  [ChainId.OPTIMISM_GOERLI]: [WNATIVE[ChainId.OPTIMISM_GOERLI]],
};

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
