import type { NextApiRequest, NextApiResponse } from 'next';

import { getFinancialsFromAPI } from './helpers/api/defillama';
import { getStakingDataFromAPI } from './helpers/api/staking';
import { Status } from './helpers/constants';
import { saveFinancialsToDB, saveStakingDataToDB } from './helpers/db';
import { filterFinancials } from './helpers/functions/filterFinancials';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const llamaResult = await getFinancialsFromAPI();
    const filteredResult = await filterFinancials(llamaResult);

    await saveFinancialsToDB(filteredResult);

    const stakingResult = await getStakingDataFromAPI();
    await saveStakingDataToDB(stakingResult);

    res.status(Status.SUCCESS).json({
      message: 'Successfully fetched and saved data to DB',
    });
  } catch (error) {
    res.status(Status.ERROR).json({ error });
  }
}
