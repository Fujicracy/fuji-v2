import { AbstractVault } from '../entities';
import { ChainId } from '../enums';

export type ChainVaultList = {
  readonly [chainId in ChainId]: AbstractVault[];
};
