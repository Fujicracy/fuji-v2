import axios from 'axios';

import { ApiRoute } from '../constants/api';
import { FujiErrorCode } from '../constants/errors';
import { FujiResultError, FujiResultSuccess } from '../entities/FujiError';
import { FinancialsResponse } from '../types/Api';
import { FujiResultPromise } from '../types/FujiResult';

export async function apiFinancials(): FujiResultPromise<FinancialsResponse> {
  try {
    const result = await axios
      .get<FinancialsResponse>(ApiRoute.FINANCIALS)
      .then(({ data }) => data);

    return new FujiResultSuccess(result);
  } catch (e) {
    console.error(e);
    return new FujiResultError('API financials call failed', FujiErrorCode.API);
  }
}
