import {
  FinancialsResponse,
  LlamaPoolStat,
  ProviderStatsResponse,
} from '@x-fuji/sdk';

export type StakingRequest = {
  url: string;
  symbol: string;
};

export type StakingResponse = {
  symbol: string;
  value: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any; // Since we're calling different APIs, let's store the raw data just in case
};

export type FinancialsAndStakingResponse = FinancialsResponse & {
  staking: StakingResponse[];
};

export type StatsDBResponse = {
  timestamp: number;
  data: ProviderStatsResponse;
};

export type GetLlamaPoolStatsResponse = {
  status: 'success' | 'error';
  data: LlamaPoolStat[];
};
