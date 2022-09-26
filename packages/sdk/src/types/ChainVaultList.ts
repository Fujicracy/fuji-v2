import { ChainId } from '../enums';
import { BorrowingVault } from '../entities';

export type ChainVaultList = {
  readonly [chainId in ChainId]: BorrowingVault[];
};
