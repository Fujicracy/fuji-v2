import type { NextApiRequest, NextApiResponse } from 'next';

import { getProviderStatsFromAPI } from './helpers/api/defillama';
import { REFRESH_INTERVAL, Status } from './helpers/constants';
import { getProviderStatsFromDB, saveProviderStatsToDB } from './helpers/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const poolId = req.query.poolId;
    if (!poolId) throw 'No poolId provided';
    if (typeof poolId !== 'string') {
      throw 'Invalid poolId provided';
    }

    const currentTime = Date.now();
    const dbData = await getProviderStatsFromDB(poolId);
    if (dbData && dbData.timestamp > currentTime - REFRESH_INTERVAL) {
      console.log('Returning cached pool stats');
      return res.status(Status.SUCCESS).json(dbData.data);
    }
    const stats = await getProviderStatsFromAPI(poolId);
    saveProviderStatsToDB(poolId, stats);

    res.status(Status.SUCCESS).json(stats);
  } catch (error) {
    res.status(Status.ERROR).json({ error });
  }
}
