import axios from 'axios';

import { ApiRoute, FujiErrorCode } from '../constants';
import { FujiResultError, FujiResultSuccess } from '../entities';
import {
  FinancialsResponse,
  FujiResultPromise,
  ProviderStatsResponse,
} from '../types';

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
