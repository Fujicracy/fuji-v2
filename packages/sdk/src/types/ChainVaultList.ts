import { ChainId } from '../enums';
import { Vault } from '../entities';

export type ChainVaultList = {
  readonly [chainId in ChainId]: Vault[];
};
