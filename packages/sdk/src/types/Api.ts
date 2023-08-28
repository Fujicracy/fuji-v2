import {
  LlamaAssetPool,
  LlamaLendBorrowPool,
  LlamaPoolStat,
} from './LlamaResponses';

export type FinancialsUri = {
  lendBorrow: string;
  pools: string;
};

export type FinancialsResponse = {
  lendBorrows: LlamaLendBorrowPool[];
  pools: LlamaAssetPool[];
};

export type ProviderStatsResponse = LlamaPoolStat[];
