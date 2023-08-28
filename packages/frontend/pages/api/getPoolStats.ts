import { ethers } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';

import { fetchPoolStats } from './helpers/api';
import { REFRESH_INTERVAL, STATUS } from './helpers/constants';
import { getPoolStatsFromDB, savePoolStatsToDB } from './helpers/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const poolId = req.query.poolId;
    if (!poolId) throw 'No poolId provided';
    if (!(typeof poolId === 'string' && ethers.utils.isAddress(poolId))) {
      throw 'Invalid poolId provided';
    }

    const currentTime = Date.now();
    const dbData = await getPoolStatsFromDB(poolId);
    if (dbData && dbData.timestamp > currentTime - REFRESH_INTERVAL) {
      console.log('Returning cached pool stats');
      return res.status(STATUS.SUCCESS).json({ stats: dbData.data });
    }
    const stats = await fetchPoolStats(poolId);
    savePoolStatsToDB(poolId, stats);

    res.status(STATUS.SUCCESS).json({ stats });
  } catch (error) {
    res.status(STATUS.ERROR).json({ error });
  }
}
