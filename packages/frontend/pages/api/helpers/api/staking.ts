import axios from 'axios';

import { STAKING_SERVICE, STAKING_URL } from '../constants';
import { StakingResponse } from '../types';

export async function getStakingDataFromAPI(): Promise<StakingResponse[]> {
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
