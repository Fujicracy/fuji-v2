import { JsonRpcProvider, TransactionReceipt } from '@ethersproject/providers';

import { FujiErrorCode } from '../constants';
import { FujiError, FujiResultError, FujiResultSuccess } from '../entities';
import { FujiResultPromise } from '../types';

const _maxAttempts = 3;
const _delayMs = 1500;

export async function waitForTransaction(
  provider: JsonRpcProvider,
  txHash: string
): FujiResultPromise<TransactionReceipt> {
  for (let attempt = 1; attempt <= _maxAttempts; attempt++) {
    const result = await _waitForTransaction(provider, txHash);
    if (result.success) {
      return result;
    }
    // No point retrying if the transaction failed for a good reason
    if (!_isRpcError(result.error)) {
      return result;
    }
    // If this was the last attempt, return the result
    if (attempt === _maxAttempts) {
      return result;
    }
    // Wait before the next attempt
    await _delay(_delayMs);
  }
  return _waitingError({
    message: 'Too many attempts', // TODO:
  });
}

async function _waitForTransaction(
  provider: JsonRpcProvider,
  txHash: string
): FujiResultPromise<TransactionReceipt> {
  try {
    const receipt = await provider.waitForTransaction(txHash);
    return new FujiResultSuccess(receipt);
  } catch (error) {
    return _waitingError({
      txHash,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function _isRpcError(error: FujiError): boolean {
  const message = error.info?.message;
  return typeof message === 'string' && message.includes('missing response');
}

function _waitingError(
  info?: Record<string, string | undefined>
): FujiResultError {
  return new FujiResultError(
    'Transaction failed on chain', // TODO: message
    FujiErrorCode.TX,
    info
  );
}

function _delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
