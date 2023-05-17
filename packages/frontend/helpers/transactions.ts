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
import {
  HistoryEntry,
  HistoryEntryStatus,
  HistoryRoutingStep,
  validSteps,
} from './history';
import { BridgeFee } from './routing';
import { camelize, toNotSoFixed } from './values';
import { stringifyError } from './errors';

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
  status: HistoryEntryStatus;
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
    return new FujiResultError('Transaction failed', FujiErrorCode.ONCHAIN, {
      message: stringifyError(error),
    });
  }
};

export const transactionSteps = (entry: HistoryEntry): TransactionStep[] => {
  // group steps by chain flow: [[X_TRANSFER], [DEPOSIT, BORROW], [X_TRANSFER]]
  const source = validSteps(entry.steps).reduce(
    (acc: Array<Array<HistoryRoutingStep>>, currentValue) => {
      if (currentValue.step !== RoutingStep.X_TRANSFER) {
        const index = acc.findIndex(
          (item) =>
            item[0].chainId === currentValue.chainId &&
            item[0].step !== RoutingStep.X_TRANSFER
        );
        if (index !== -1) {
          acc[index].push(currentValue);
        } else {
          acc.push([currentValue]);
        }
      } else {
        acc.push([currentValue]);
      }
      return acc;
    },
    []
  );
  // we can be certain thanks to the reduce above that
  // there's 1-to-1 mapping between indexes and sourceChain/secondChain/thirdChain
  return source.map((array, i): TransactionStep => {
    const s = array[0];

    const e =
      i === 0
        ? entry.sourceChain
        : i === 1
        ? entry.secondChain
        : entry.thirdChain;
    const chainId = e?.chainId as ChainId;
    const status = e?.status as HistoryEntryStatus;
    const txHash = e?.hash;

    const chain = chainName(chainId);

    const link = txHash && transactionUrl(chainId, txHash);

    const labelify = (step: HistoryRoutingStep): string => {
      const amount =
        step.token &&
        toNotSoFixed(formatUnits(step.amount ?? 0, step.token.decimals), true);
      const action = step.step.toString();
      const preposition =
        step.step === RoutingStep.DEPOSIT
          ? 'on'
          : [
              RoutingStep.X_TRANSFER,
              RoutingStep.BORROW,
              RoutingStep.PAYBACK,
            ].includes(step.step)
          ? 'to'
          : 'from';

      const name = step.lendingProvider?.name;

      const label = camelize(
        `${action} ${amount} ${step.token?.symbol} ${name ? preposition : ''} ${
          name ?? ''
        }`
      );
      return label;
    };

    let label = labelify(s);

    const s2 = array[1];
    if (s2) {
      label += ` and ${labelify(s2)}`;
    }

    const description = `${chain} Network`;

    return {
      label,
      status,
      txHash,
      link,
      description,
      chain,
      chainId,
    };
  });
};

export const bridgeFeeSum = (bridgeFees: BridgeFee[]): number => {
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
