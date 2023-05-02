import {
  ChainId,
  FujiErrorCode,
  FujiResultError,
  FujiResultPromise,
  FujiResultSuccess,
  RoutingStep,
  RoutingStepDetails,
} from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';

import { sdk } from '../services/sdk';
import { FetchStatus } from '../store/borrow.store';
import { chainName, transactionUrl } from './chains';
import { HistoryEntry, HistoryEntryStatus, validSteps } from './history';
import { BridgeFee } from './routing';
import { camelize, toNotSoFixed } from './values';

export type TransactionMeta = {
  status: FetchStatus;
  gasFees: number; // TODO: cannot estimate gas fees until the user has approved AND permit fuji to use its fund
  estimateTime: number;
  steps: RoutingStepDetails[];
  bridgeFees: BridgeFee[] | undefined;
  estimateSlippage: number | undefined;
};

export type TransactionStep = {
  label: string;
  description: string;
  chainId: number;
  chain: string;
  txHash?: string;
  link?: string;
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

export const transactionSteps = (entry: HistoryEntry): TransactionStep[] => {
  const source = validSteps(entry.steps);
  return source.map((s, i): TransactionStep => {
    const { step, chainId, token } = s;

    const realChainId =
      s.step === RoutingStep.X_TRANSFER && i === 0 && s.token
        ? s.token.chainId
        : chainId;

    const chain = chainName(realChainId);
    const amount = token && formatUnits(s.amount ?? 0, token.decimals);

    const txHash =
      realChainId === entry.sourceChain.chainId
        ? entry.hash
        : entry.secondChain?.hash;

    const link = txHash && transactionUrl(realChainId, txHash);

    const action = step.toString();
    const preposition =
      step === RoutingStep.DEPOSIT
        ? 'on'
        : [
            RoutingStep.X_TRANSFER,
            RoutingStep.BORROW,
            RoutingStep.PAYBACK,
          ].includes(step)
        ? 'to'
        : 'from';

    const name = s.lendingProvider?.name;

    const label = camelize(
      `${action} ${amount} ${token?.symbol} ${name ? preposition : ''} ${
        name ?? ''
      }`
    );

    const description = `${chain} Network`;

    return {
      label,
      txHash,
      link,
      description,
      chain,
      chainId: realChainId,
    };
  });
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

const bridgeFeeSum = (bridgeFees: BridgeFee[]): number => {
  return bridgeFees.reduce((sum, fee) => {
    const cost = fee.amount * fee.priceUSD;
    return sum + cost;
  }, 0);
};

export const stringifiedBridgeFeeSum = (bridgeFees?: BridgeFee[]): string => {
  if (!bridgeFees) {
    return Number(0).toFixed(2);
  }
  return toNotSoFixed(bridgeFeeSum(bridgeFees), true);
};
