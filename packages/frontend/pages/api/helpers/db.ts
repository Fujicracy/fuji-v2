import { kv } from '@vercel/kv';
import {
  LlamaAssetPool,
  LlamaLendBorrowPool,
  LlamaPoolStat,
} from '@x-fuji/sdk';

import { DB_KEY } from './constants';
import {
  FinancialsAndStakingResponse,
  FinancialsResponse,
  StakingResponse,
  StatsDBResponse,
} from './types';

export async function getFinancialsAndStakingFromDB(): Promise<FinancialsAndStakingResponse> {
  const pools = (await kv.get(DB_KEY.POOLS)) as LlamaAssetPool[];
  const lendBorrows = (await kv.get(
    DB_KEY.LEND_BORROW
  )) as LlamaLendBorrowPool[];
  const staking = (await kv.get(DB_KEY.STAKING_APY)) as StakingResponse[];
  return { pools, lendBorrows, staking };
}

export async function getProviderStatsFromDB(
  poolId: string
): Promise<StatsDBResponse> {
  const stats = (await kv.get(
    DB_KEY.PROVIDER_STATS + `/${poolId}`
  )) as StatsDBResponse;
  return stats;
}

export async function saveFinancialsToDB(data: FinancialsResponse) {
  try {
    const poolsResult = await kv.set(DB_KEY.POOLS, data.pools);
    const lendBorrowsResult = await kv.set(
      DB_KEY.LEND_BORROW,
      data.lendBorrows
    );

    if (poolsResult === 'OK' && lendBorrowsResult === 'OK') {
      console.log('Saved financials to DB');
    } else throw 'Failed to save financials to DB';
  } catch (error) {
    console.error('Failed to save financials to DB:', error);
    throw error;
  }
}

export async function saveStakingDataToDB(data: StakingResponse[]) {
  try {
    const result = await kv.set(DB_KEY.STAKING_APY, data);

    if (result === 'OK') {
      console.log('Saved staking to DB');
    } else throw 'Failed to save staking to DB';
  } catch (error) {
    console.error('Failed to save staking to DB:', error);
    throw error;
  }
}

export async function saveProviderStatsToDB(
  poolId: string,
  stats: LlamaPoolStat[]
) {
  try {
    const data = {
      timestamp: Date.now(),
      data: stats,
    };
    const result = await kv.set(DB_KEY.PROVIDER_STATS + `/${poolId}`, data);
    if (result === 'OK') {
      console.log(`Saved stats for pool ${poolId} to DB`);
    } else throw `Failed to save stats for pool ${poolId} to DB`;
  } catch (error) {
    console.error(`Failed to save stats for pool ${poolId} to DB:`, error);
    throw error;
  }
}