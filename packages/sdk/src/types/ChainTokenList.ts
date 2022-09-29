import { Token } from '../entities';
import { ChainId } from '../enums';

export type ChainTokenList = {
  readonly [chainId in ChainId]: Token[];
};
