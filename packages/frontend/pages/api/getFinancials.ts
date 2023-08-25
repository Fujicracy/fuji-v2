import { LlamaAssetPool } from '@x-fuji/sdk';
import type { NextApiRequest, NextApiResponse } from 'next';

import { STATUS } from './helpers/constants';
import { getFinancialsAndStakingFromDB } from './helpers/db';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const result = await getFinancialsAndStakingFromDB();
  console.log(result.staking);
  console.log('GOT RESULT');
  // Update pools with staking rewards. Might have to improve based on more checks than just symbol
  result.pools.forEach((pool: LlamaAssetPool) => {
    const match = result.staking.find((apy) => apy.symbol === pool.symbol);
    if (match) {
      console.log('MATCH');
      pool.stakingApy = match.value;
    }
  });

  res
    .status(STATUS.SUCCESS)
    .json({ pools: result.pools, lendBorrows: result.lendBorrows });
}
