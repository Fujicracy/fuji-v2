export const DEFILLAMA_PROXY = process.env.DEFILLAMA_PROXY;

export const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const REFRESH_INTERVAL = FIFTEEN_MINUTES;

export enum Status {
  SUCCESS = 200,
  TOO_MANY_REQUESTS = 429,
  ERROR = 500,
}

export enum ApiRoute {
  GET_FINANCIALS = '/api/geFinancials',
  UPDATE_FINANCIALS = '/api/updateFinancials',
  GET_STATS = '/api/getPoolStats',
}

export enum DefillamaUrl {
  LEND_BORROW = 'https://yields.llama.fi/lendBorrow',
  POOLS = 'https://yields.llama.fi/pools',
  PROVIDER_STATS = 'https://yields.llama.fi/chartLendBorrow',
}

export enum DbKey {
  LEND_BORROW = 'lendBorrow',
  POOLS = 'pools',
  STAKING_APY = 'stakingApy',
  PROVIDER_STATS = 'poolStats',
}

export enum StakingService {
  MATICX = 'MATICX',
  WSTETH = 'WSTETH',
  RETH = 'RETH',
}

export const STAKING_URL: Record<StakingService, string> = {
  [StakingService.MATICX]: 'https://universe.staderlabs.com/polygon/apy',
  [StakingService.WSTETH]: 'https://eth-api.lido.fi/v1/protocol/steth/apr/last',
  [StakingService.RETH]: 'https://api.rocketpool.net/api/apr',
};
