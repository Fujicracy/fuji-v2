import {
  FinancialsResponse,
  FinancialsUri,
  ProviderStatsResponse,
} from '@x-fuji/sdk';
import axios from 'axios';

import { DEFILLAMA_PROXY, DefillamaUrl } from '../constants';
import { GetLlamaPoolStatsResponse } from '../types';

function defillamaUri(): FinancialsUri {
  return {
    lendBorrow: DEFILLAMA_PROXY
      ? `${DEFILLAMA_PROXY}lendBorrow`
      : DefillamaUrl.LEND_BORROW.toString(),
    pools: DEFILLAMA_PROXY
      ? `${DEFILLAMA_PROXY}pools`
      : DefillamaUrl.POOLS.toString(),
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

export async function getProviderStatsFromAPI(
  poolId: string
): Promise<ProviderStatsResponse> {
  const stats = await axios
    .get<GetLlamaPoolStatsResponse>(DefillamaUrl.PROVIDER_STATS + `/${poolId}`)
    .then(({ data }) => data.data);
  return { stats };
}
