import axios from 'axios';

import { FujiErrorCode, URLS } from '../constants';
import { FujiResultError, FujiResultSuccess } from '../entities';
import { FujiResultPromise } from '../types';
import {
  GetLlamaAssetPoolsResponse,
  GetLLamaFinancialsResponse,
  GetLlamaLendBorrowPoolsResponse,
} from '../types/LlamaResponses';

export async function llamaFinancials(
  defillamaproxy: string | undefined
): FujiResultPromise<GetLLamaFinancialsResponse> {
  // fetch from DefiLlama
  const uri = {
    lendBorrow: defillamaproxy
      ? defillamaproxy + 'lendBorrow'
      : URLS.DEFILLAMA_LEND_BORROW,
    pools: defillamaproxy ? defillamaproxy + 'pools' : URLS.DEFILLAMA_POOLS,
  };
  try {
    const [lendBorrows, pools] = await Promise.all([
      axios
        .get<GetLlamaLendBorrowPoolsResponse>(uri.lendBorrow)
        .then(({ data }) => data),
      axios
        .get<GetLlamaAssetPoolsResponse>(uri.pools)
        .then(({ data }) => data.data),
    ]);
    return new FujiResultSuccess({ lendBorrows, pools });
  } catch (e) {
    const message = axios.isAxiosError(e)
      ? `DefiLlama API call failed with a message: ${e.message}`
      : 'DefiLlama API call failed with an unexpected error!';
    console.error(message);
    return new FujiResultError(message, FujiErrorCode.LLAMA);
  }
}
