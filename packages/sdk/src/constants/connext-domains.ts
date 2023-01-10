import { ChainId } from '../enums';

export const CONNEXT_DOMAIN: { [chainId in ChainId]?: number } = {
  [ChainId.ETHEREUM]: 6648936,
  [ChainId.MATIC]: 1886350457,
  [ChainId.OPTIMISM]: 1869640809,
  [ChainId.ARBITRUM]: 1634886255,
  [ChainId.GOERLI]: 1735353714,
  [ChainId.OPTIMISM_GOERLI]: 1735356532,
  [ChainId.MATIC_MUMBAI]: 9991,
};
