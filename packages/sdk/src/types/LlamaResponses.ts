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
  stakingApy?: number;
};

export type LlamaLendBorrowPool = {
  pool: string;
  apyBaseBorrow: number;
  apyRewardBorrow: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  ltv: number;
  rewardTokens: [];
};

export type LlamaPoolStat = {
  timestamp: string;
  apyBase: number;
  apyReward: number;
  apyBaseBorrow: number;
  apyRewardBorrow: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
};

export type GetLlamaAssetPoolsResponse = {
  status: 'success' | 'error';
  data: LlamaAssetPool[];
};

export type GetLlamaPoolStatsResponse = {
  status: 'success' | 'error';
  data: LlamaPoolStat[];
};

export type GetLlamaLendBorrowPoolsResponse = LlamaLendBorrowPool[];
