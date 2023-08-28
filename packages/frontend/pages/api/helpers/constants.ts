export const PORT = Number(process.env.PORT) || 3000;
export const REDIS_URL = process.env.REDIS_URL ?? '';
export const DEFILLAMA_PROXY = process.env.DEFILLAMA_PROXY;

export const FIFTEEN_MINUTES = 15 * 60 * 1000;
export const THREE_DAYS_IN_SECONDS = 3 * 24 * 60 * 60;

export const REFRESH_INTERVAL = FIFTEEN_MINUTES;

export enum STATUS {
  SUCCESS = 200,
  ERROR = 500,
}

const DEFILLAMA_PATH = 'https://yields.llama.fi';
export enum DEFILLAMA_URL {
  LEND_BORROW = `${DEFILLAMA_PATH}/lendBorrow`,
  POOLS = `${DEFILLAMA_PATH}/pools`,
  CHART = `${DEFILLAMA_PATH}/chartLendBorrow`,
}

export enum DB_KEY {
  LEND_BORROW = 'lendBorrow',
  POOLS = 'pools',
  STAKING_APY = 'stakingApy',
  POOL_STATS = 'poolStats',
}

export enum STAKING_SERVICE {
  MATICX = 'MATICX',
  WSTETH = 'WSTETH',
  RETH = 'RETH',
}

export const STAKING_URL: Record<STAKING_SERVICE, string> = {
  [STAKING_SERVICE.MATICX]: 'https://universe.staderlabs.com/polygon/apy',
  [STAKING_SERVICE.WSTETH]:
    'https://eth-api.lido.fi/v1/protocol/steth/apr/last',
  [STAKING_SERVICE.RETH]: 'https://api.rocketpool.net/api/apr',
};
