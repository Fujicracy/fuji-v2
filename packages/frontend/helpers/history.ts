import {
  Address,
  ChainId,
  FujiErrorCode,
  FujiResult,
  FujiResultError,
  FujiResultSuccess,
  RoutingStep,
  RoutingStepDetails,
  Token,
} from '@x-fuji/sdk';
import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';

import { CONFIRMATIONS } from '../constants';
import { sdk } from '../services/sdk';
import { camelize } from './values';

/**
 * Contains all we need to instantiate a token with new Token()
 */
export type SerializableToken = {
  chainId: ChainId;
  address: string;
  decimals: number;
  symbol: string;
  name?: string;
};

export enum HistoryEntryStatus {
  ONGOING,
  DONE,
  ERROR,
}

export type HistoryEntry = {
  hash: string;
  steps: HistoryRoutingStep[];
  status: HistoryEntryStatus;
  connextTransferId?: string;
  vaultAddr?: string;
};

export type HistoryRoutingStep = Omit<
  RoutingStepDetails,
  'txHash' | 'token'
> & {
  txHash?: string;
  token?: SerializableToken;
};

export const toRoutingStepDetails = (
  s: HistoryRoutingStep[]
): RoutingStepDetails[] => {
  return s.map((s) => ({
    ...s,
    txHash: undefined,
    token: s.token
      ? new Token(
          s.token.chainId,
          Address.from(s.token.address),
          s.token.decimals,
          s.token.symbol,
          s.token.name
        )
      : undefined,
  }));
};

export const toHistoryRoutingStep = (
  s: RoutingStepDetails[]
): HistoryRoutingStep[] => {
  return s.map((s: RoutingStepDetails) => {
    return {
      ...s,
      txHash: undefined,
      token: s.token
        ? {
            chainId: s.token.chainId,
            address: s.token.address.value,
            decimals: s.token.decimals,
            symbol: s.token.symbol,
            name: s.token.name,
          }
        : undefined,
    };
  });
};

export const entryOutput = (
  step: RoutingStepDetails,
  hash: string
): {
  title: string;
  transactionUrl: {
    hash: string;
    chainId: ChainId;
  };
} => {
  const stepAction = camelize(step.step.toString());
  const stepAmount =
    step.amount && formatUnits(step.amount, step.token?.decimals);
  const title = `${stepAction} ${stepAmount} ${step.token?.symbol}}`;
  const chainId = step.chainId;

  return {
    title,
    transactionUrl: {
      hash,
      chainId,
    },
  };
};

export const stepFromEntry = (
  entry: HistoryEntry,
  type: RoutingStep
): HistoryRoutingStep | undefined => {
  return entry.steps.find((s) => s.step === type);
};

export const watchTransaction = async (
  chainId: ChainId,
  txHash: string,
  callback: (sarasa: FujiResult<ethers.providers.TransactionReceipt>) => void
) => {
  const { rpcProvider } = sdk.getConnectionFor(chainId);

  const onBlock = async () => {
    const currentReceipt = await rpcProvider.getTransactionReceipt(txHash);
    if (currentReceipt && currentReceipt.confirmations > CONFIRMATIONS) {
      console.log(
        `Transaction ${txHash} has been confirmed ${currentReceipt.confirmations} times.`
      );
      done();
      callback(new FujiResultSuccess(currentReceipt));
    }
  };

  const onError = (error: Error) => {
    console.error(`Transaction ${txHash} failed: ${error}`);
    done();
    callback(new FujiResultError(error.message, FujiErrorCode.ONCHAIN));
  };

  const done = () => {
    rpcProvider.removeListener('block', onBlock);
    rpcProvider.removeListener('error', onError);
  };

  rpcProvider.on('block', onBlock);
  rpcProvider.on('error', onError);
};
