import { ChainId } from '../enums';
import { ChainTokenList } from '../types';
import { DAI, USDC } from './tokens';

export const DEBT_LIST: ChainTokenList = {
  [ChainId.ETHEREUM]: [USDC[ChainId.ETHEREUM], DAI[ChainId.ETHEREUM]],
  [ChainId.GOERLI]: [USDC[ChainId.GOERLI], DAI[ChainId.GOERLI]],
  [ChainId.MATIC]: [USDC[ChainId.MATIC], DAI[ChainId.MATIC]],
  [ChainId.MATIC_MUMBAI]: [
    USDC[ChainId.MATIC_MUMBAI],
    DAI[ChainId.MATIC_MUMBAI],
  ],
  [ChainId.FANTOM]: [USDC[ChainId.FANTOM], DAI[ChainId.FANTOM]],
  [ChainId.ARBITRUM]: [USDC[ChainId.ARBITRUM], DAI[ChainId.ARBITRUM]],
  [ChainId.OPTIMISM]: [USDC[ChainId.OPTIMISM], DAI[ChainId.OPTIMISM]],
  [ChainId.OPTIMISM_GOERLI]: [
    USDC[ChainId.OPTIMISM_GOERLI],
    DAI[ChainId.OPTIMISM_GOERLI],
  ],
};
