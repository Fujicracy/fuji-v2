export type LlamaAssetPool = {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number;
  apyReward: number;
  apy: number;
  rewardTokens: string[];
  pool: string;
};

export type LlamaBorrowPool = {
  pool: string;
  apyBaseBorrow: number;
  apyRewardBorrow: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  ltv: number;
  rewardTokens: [];
};

export type GetLlamaAssetPoolsResponse = {
  status: 'success' | 'error';
  data: LlamaAssetPool[];
};

export type GetLlamaBorrowPoolsResponse = LlamaBorrowPool[];
