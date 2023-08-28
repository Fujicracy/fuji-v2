import { GetLlamaPoolStatsResponse } from '@x-fuji/sdk';
import axios from 'axios';

import {
  DEFILLAMA_PROXY,
  DEFILLAMA_URL,
  STAKING_SERVICE,
  STAKING_URL,
} from './constants';
import { DefillamaUri, FinancialsResponse, StakingResponse } from './types';

function defillamaUri(): DefillamaUri {
  return {
    lendBorrow: DEFILLAMA_PROXY
      ? `${DEFILLAMA_PROXY}lendBorrow`
      : DEFILLAMA_URL.LEND_BORROW,
    pools: DEFILLAMA_PROXY ? `${DEFILLAMA_PROXY}pools` : DEFILLAMA_URL.POOLS,
  };
}

export async function fetchFinancials(): Promise<FinancialsResponse> {
  const uri = defillamaUri();
  try {
    console.log('Starting Defillama API requests');
    const [lendBorrows, pools] = await Promise.all([
      axios.get(uri.lendBorrow).then(({ data }) => data),
      axios.get(uri.pools).then(({ data }) => data.data),
    ]);
    console.log('Completed requests to Defillama API');
    return { lendBorrows, pools };
  } catch (error) {
    console.error('Failed to fetch data from API:', error);
    throw error;
  }
}

export async function fetchPoolStats(poolId: string) {
  const chart = axios
    .get<GetLlamaPoolStatsResponse>(DEFILLAMA_URL.CHART + `/${poolId}`)
    .then(({ data }) => data.data);
  return chart;
}

export async function fetchStaking(): Promise<StakingResponse[]> {
  try {
    console.log('Starting staking API requests');
    const data = await Promise.all([
      axios.get(STAKING_URL.MATICX).then(({ data }) => {
        return { symbol: STAKING_SERVICE.MATICX, value: data.value };
      }),
      axios.get(STAKING_URL.WSTETH).then(({ data }) => {
        const value = data.data.apr;
        return { symbol: STAKING_SERVICE.WSTETH, value, data };
      }),
      axios.get(STAKING_URL.RETH).then(({ data }) => {
        const value = parseFloat(data.yearlyAPR);
        return { symbol: STAKING_SERVICE.RETH, value };
      }),
    ]);
    console.log('Completed requests to staking API');
    return data;
  } catch (error) {
    console.error('Failed to fetch staking data from API:', error);
    throw error;
  }
}
