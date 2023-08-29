import axios from 'axios';

import { ApiRoute } from '../constants/api';
import { FujiErrorCode } from '../constants/errors';
import { FujiResultError, FujiResultSuccess } from '../entities/FujiError';
import { ProviderStatsResponse } from '../types/Api';
import { FujiResultPromise } from '../types/FujiResult';

export async function apiProviderStats(
  providerId: string
): FujiResultPromise<ProviderStatsResponse> {
  console.log(providerId);
  try {
    const result = await axios
      .get<ProviderStatsResponse>(`${ApiRoute.PROVIDER_STATS}/${providerId}`)
      .then(({ data }) => data);

    return new FujiResultSuccess(result);
  } catch (e) {
    console.error(e);
    return new FujiResultError(
      'API providers stats call failed',
      FujiErrorCode.API
    );
  }
}
