import axios from 'axios';

import { FujiErrorCode } from '../constants';
import { FujiResultError, FujiResultSuccess } from '../entities';
import { FujiResultPromise } from '../types';
import { GetLLamaFinancialsResponse } from '../types/LlamaResponses';

export async function llamaFinancials(): FujiResultPromise<GetLLamaFinancialsResponse> {
  const uri = ''; // TODO: Add DefiLlama API endpoint
  try {
    const result = await axios
      .get<GetLLamaFinancialsResponse>(uri)
      .then((res) => res.data);

    return new FujiResultSuccess(result);
  } catch (e) {
    const message = axios.isAxiosError(e)
      ? `DefiLlama API call failed with a message: ${e.message}`
      : 'DefiLlama API call failed with an unexpected error!';
    console.error(message);
    return new FujiResultError(message, FujiErrorCode.LLAMA);
  }
}
