import { ChainId } from '../enums';

export const CONNEXT_DOMAIN: { [chainId in ChainId]?: number } = {
  [ChainId.GOERLI]: 1735353714,
  [ChainId.OPTIMISM_GOERLI]: 1735356532,
  [ChainId.MATIC_MUMBAI]: 9991,
};
