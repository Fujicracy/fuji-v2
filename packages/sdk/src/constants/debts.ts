import { ChainId } from '../enums';
import { ChainTokenList } from '../types';
import { DAI, USDC, USDT } from './tokens';

export const DEBT_LIST: ChainTokenList = {
  [ChainId.ETHEREUM]: [USDC[ChainId.ETHEREUM]],
  [ChainId.GOERLI]: [DAI[ChainId.GOERLI]],
  [ChainId.MATIC]: [USDC[ChainId.MATIC]],
  [ChainId.MATIC_MUMBAI]: [
    USDC[ChainId.MATIC_MUMBAI],
    USDT[ChainId.MATIC_MUMBAI],
    DAI[ChainId.MATIC_MUMBAI],
  ],
  [ChainId.FANTOM]: [USDC[ChainId.FANTOM], DAI[ChainId.FANTOM]],
  [ChainId.ARBITRUM]: [USDC[ChainId.ARBITRUM]],
  [ChainId.OPTIMISM]: [USDC[ChainId.OPTIMISM]],
  [ChainId.OPTIMISM_GOERLI]: [
    USDC[ChainId.OPTIMISM_GOERLI],
    USDT[ChainId.OPTIMISM_GOERLI],
    DAI[ChainId.OPTIMISM_GOERLI],
  ],
};
