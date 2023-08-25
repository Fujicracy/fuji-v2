import { LlamaAssetPool } from '@x-fuji/sdk';
import type { NextApiRequest, NextApiResponse } from 'next';

import { STATUS } from './helpers/constants';
import { getFinancialsAndStakingFromDB } from './helpers/db';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await getFinancialsAndStakingFromDB();
    // Update pools with staking rewards. Might have to improve based on more checks than just symbol
    result.pools.forEach((pool: LlamaAssetPool) => {
      const match = result.staking.find((apy) => apy.symbol === pool.symbol);
      if (match) {
        pool.stakingApy = match.value;
      }
    });

    res
      .status(STATUS.SUCCESS)
      .json({ pools: result.pools, lendBorrows: result.lendBorrows });
  } catch (error) {
    res.status(STATUS.ERROR).json({ error });
  }
}
