import { ChainId } from '../enums';
import { Token } from '../entities';

export type ChainTokenList = {
  readonly [chainId in ChainId]: Token[];
};
