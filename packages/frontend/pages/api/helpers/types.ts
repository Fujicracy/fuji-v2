import { LlamaAssetPool, LlamaLendBorrowPool } from '@x-fuji/sdk';

export type DefillamaUri = {
  lendBorrow: string;
  pools: string;
};

export type StakingRequest = {
  url: string;
  symbol: string;
};

/*
 * It's not up to us, we store whatever Defillama returns
 * and inferring a type wouldn't be nice at all.
 */
export type FinancialsResponse = {
  lendBorrows: LlamaLendBorrowPool[];
  pools: LlamaAssetPool[];
};

export type StakingResponse = {
  symbol: string;
  value: number;
  data?: any; // Since we're calling different APIs, let's store the raw data just in case
};

export type FinancialsAndStakingResponse = FinancialsResponse & {
  staking: StakingResponse[];
};
