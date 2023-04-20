import {
  ChainId,
  FujiErrorCode,
  FujiResultError,
  FujiResultPromise,
  FujiResultSuccess,
} from '@x-fuji/sdk';

import { sdk } from '../services/sdk';
import { HistoryEntry, HistoryEntryStatus } from './history';

export type TransactionStep = {
  label: string;
  description: string;
  chainId: number;
  txHash?: string;
  link?: string;
  icon: () => JSX.Element;
};

export const watchTransaction = async (
  chainId: ChainId,
  txHash: string
): FujiResultPromise<boolean> => {
  const { rpcProvider } = sdk.getConnectionFor(chainId);
  try {
    const receipt = await rpcProvider.waitForTransaction(txHash);
    if (receipt.status === 1) {
      return new FujiResultSuccess(true);
    } else {
      return new FujiResultError('Transaction failed', FujiErrorCode.ONCHAIN);
    }
  } catch (error) {
    return new FujiResultError('Transaction failed', FujiErrorCode.ONCHAIN);
  }
};

export const statusForStep = (
  step: TransactionStep,
  entry: HistoryEntry
): HistoryEntryStatus => {
  if (step.chainId === entry.sourceChain.chainId) {
    return entry.sourceChain.status;
  }
  if (entry.secondChain && step.chainId === entry.secondChain.chainId) {
    return entry.secondChain.status;
  }
  return entry.status;
};
