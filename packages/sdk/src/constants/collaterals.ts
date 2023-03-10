import { ChainId } from '../enums';
import { ChainTokenList } from '../types';
import { WETH9, WNATIVE } from './tokens';

export const COLLATERAL_LIST: ChainTokenList = {
  [ChainId.ETHEREUM]: [WNATIVE[ChainId.ETHEREUM]],
  [ChainId.GOERLI]: [WETH9[ChainId.GOERLI]],
  [ChainId.MATIC]: [WETH9[ChainId.MATIC]],
  [ChainId.MATIC_MUMBAI]: [WETH9[ChainId.MATIC_MUMBAI]],
  [ChainId.FANTOM]: [WNATIVE[ChainId.FANTOM], WETH9[ChainId.FANTOM]],
  [ChainId.ARBITRUM]: [WNATIVE[ChainId.ARBITRUM]],
  [ChainId.OPTIMISM]: [WNATIVE[ChainId.OPTIMISM]],
  [ChainId.OPTIMISM_GOERLI]: [WETH9[ChainId.OPTIMISM_GOERLI]],
  [ChainId.GNOSIS]: [WETH9[ChainId.GNOSIS]],
};
