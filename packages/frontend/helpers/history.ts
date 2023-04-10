import {
  Address,
  ChainId,
  RoutingStep,
  RoutingStepDetails,
  Token,
} from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';

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
