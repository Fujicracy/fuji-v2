import { GetLlamaPoolStatsResponse } from '@x-fuji/sdk';
import axios from 'axios';

import { DEFILLAMA_PROXY, DEFILLAMA_URL } from '../constants';
import { DefillamaUri, FinancialsResponse } from '../types';

function defillamaUri(): DefillamaUri {
  return {
    lendBorrow: DEFILLAMA_PROXY
      ? `${DEFILLAMA_PROXY}lendBorrow`
      : DEFILLAMA_URL.LEND_BORROW.toString(),
    pools: DEFILLAMA_PROXY
      ? `${DEFILLAMA_PROXY}pools`
      : DEFILLAMA_URL.POOLS.toString(),
  };
}

export async function getFinancialsFromAPI(): Promise<FinancialsResponse> {
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

export async function getProviderStatsFromAPI(poolId: string) {
  const chart = axios
    .get<GetLlamaPoolStatsResponse>(DEFILLAMA_URL.PROVIDER_STATS + `/${poolId}`)
    .then(({ data }) => data.data);
  return chart;
}
