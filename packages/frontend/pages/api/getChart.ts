import type { NextApiRequest, NextApiResponse } from 'next';

import { fetchChart } from './helpers/api';
import { STATUS } from './helpers/constants';
import { getFinancialsAndStakingFromDB } from './helpers/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // const poolId = req.query.poolId;
    // if (!poolId) throw 'No poolId provided';
    // if (!(typeof poolId === 'string' && ethers.utils.isAddress(poolId))) {
    //   throw 'Invalid poolId provided';
    // }

    const sarasa = await getFinancialsAndStakingFromDB();
    const a = sarasa.pools[0].pool as string;

    const currentTime = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    if (data && JSON.parse(data).timestamp > currentTime - thirtyMinutes)
      const result = await fetchChart(a);

    res.status(STATUS.SUCCESS).json({ result });
  } catch (error) {
    res.status(STATUS.ERROR).json({ error });
  }
}
