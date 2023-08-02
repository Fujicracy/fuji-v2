import { AbstractVault } from '../entities/abstract/AbstractVault';
import { ChainId } from '../enums';

export type ChainVaultList = {
  readonly [chainId in ChainId]: AbstractVault[];
};
