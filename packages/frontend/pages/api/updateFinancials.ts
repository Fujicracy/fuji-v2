import type { NextApiRequest, NextApiResponse } from 'next';

import { getFinancialsFromAPI, getStakingDataFromAPI } from './helpers/api';
import { STATUS } from './helpers/constants';
import { saveFinancialsToDB, saveStakingDataToDB } from './helpers/db';
import { filterFinancials } from './helpers/functions/vaults';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const llamaResult = await getFinancialsFromAPI();
    const filteredResult = await filterFinancials(llamaResult);

    await saveFinancialsToDB(filteredResult);

    const stakingResult = await getStakingDataFromAPI();
    await saveStakingDataToDB(stakingResult);

    res.status(STATUS.SUCCESS).json({
      message: 'Successfully fetched and saved data to DB',
    });
  } catch (error) {
    res.status(STATUS.ERROR).json({ error });
  }
}
