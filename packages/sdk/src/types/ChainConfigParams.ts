import { ChainId } from '../enums';

export type ChainConfigParams = {
  infuraId: string;
  alchemy?: {
    [chainId in ChainId]?: string;
  };
};
