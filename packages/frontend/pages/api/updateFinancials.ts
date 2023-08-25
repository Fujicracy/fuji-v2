import type { NextApiRequest, NextApiResponse } from 'next';

import { fetchFinancialsApi, fetchStakingData } from './helpers/api';
import { STATUS } from './helpers/constants';
import { saveFinancialsToDB, saveStakingToDB } from './helpers/db';
import { filterFinancials } from './helpers/vaults';

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  try {
    const llamaResult = await fetchFinancialsApi();
    const filteredResult = await filterFinancials(llamaResult);

    await saveFinancialsToDB(filteredResult);

    const stakingResult = await fetchStakingData();
    await saveStakingToDB(stakingResult);

    res.status(STATUS.SUCCESS).json({
      message: 'Successfully fetched and saved data to DB',
    });
  } catch (error) {
    res.status(STATUS.ERROR).json({ error });
  }
}
