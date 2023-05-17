import { JsonRpcProvider, TransactionReceipt } from '@ethersproject/providers';

import { FujiErrorCode } from '../constants';
import { FujiResultError, FujiResultSuccess } from '../entities';
import { FujiResultPromise } from '../types';

export async function waitForTransaction(
  provider: JsonRpcProvider,
  txHash: string
): FujiResultPromise<TransactionReceipt> {
  const result = await _retry(_waitForTransaction, provider, txHash);
  console.log(result);
  return result;
}

async function _waitForTransaction(
  provider: JsonRpcProvider,
  txHash: string
): FujiResultPromise<TransactionReceipt> {
  try {
    const receipt = await provider.waitForTransaction(txHash);
    return new FujiResultSuccess(receipt);
  } catch (error) {
    return new FujiResultError(
      'Transaction failed on chain', // TODO: message
      FujiErrorCode.TX,
      {
        txHash,
        message: String(error), // TODO:
      }
    );
  }
}

async function _retry<T>(
  fn: (...args: any[]) => FujiResultPromise<T>,
  ...args: any[]
): Promise<FujiResultPromise<T>> {
  try {
    return await fn(...args);
  } catch (error) {
    // TODO: Should we add a delay here?
    // TODO: If tx was for instance reverted, don't even attempt to retry
    return await fn(...args);
  }
}
