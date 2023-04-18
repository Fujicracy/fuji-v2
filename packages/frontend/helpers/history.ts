import { ChainId, RoutingStep, RoutingStepDetails } from '@x-fuji/sdk';

import { useAuth } from '../store/auth.store';
import { useBorrow } from '../store/borrow.store';
import { updateNativeBalance } from './balances';
import { hexToChainId } from './chains';

export enum HistoryEntryStatus {
  ONGOING,
  SUCCESS,
  FAILURE,
}

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

export type HistoryEntryChain = {
  chainId: ChainId;
  status: HistoryEntryStatus;
  hash?: string;
  shown?: boolean; // If the user reloads the page while executing a cross-chain tx, without this prop we show the initial notification again
};

export type HistoryEntry = {
  hash: string;
  steps: HistoryRoutingStep[];
  status: HistoryEntryStatus;
  connextTransferId?: string;
  vaultAddress?: string;
  sourceChain: HistoryEntryChain;
  isCrossChain: boolean; // Convenience
  destinationChain: HistoryEntryChain | undefined;
};

export type HistoryRoutingStep = Omit<RoutingStepDetails, 'token'> & {
  token?: SerializableToken;
};

export const validSteps = (
  steps: HistoryRoutingStep[]
): HistoryRoutingStep[] => {
  return steps.filter(
    (s) =>
      s.step !== RoutingStep.START &&
      s.step !== RoutingStep.END &&
      s.token &&
      s.amount
  );
};

export const toHistoryRoutingStep = (
  steps: RoutingStepDetails[]
): HistoryRoutingStep[] => {
  return steps.map((s: RoutingStepDetails) => {
    return {
      ...s,
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

export const stepFromEntry = (
  entry: HistoryEntry,
  type: RoutingStep
): HistoryRoutingStep | undefined => {
  return entry.steps.find((s) => s.step === type);
};

export const triggerUpdatesFromSteps = (
  steps: HistoryRoutingStep[],
  chainId: ChainId
) => {
  const result = validSteps(steps).filter((s) => s.chainId === chainId);
  result.forEach((s) => {
    if (s.step === RoutingStep.DEPOSIT || s.step === RoutingStep.WITHDRAW) {
      useBorrow.getState().updateBalances('collateral');
    } else if (
      s.step === RoutingStep.BORROW ||
      s.step === RoutingStep.PAYBACK
    ) {
      useBorrow.getState().updateBalances('debt');
    }
    if (s.step === RoutingStep.DEPOSIT) {
      useBorrow.getState().updateAllowance('collateral');
    } else if (s.step === RoutingStep.PAYBACK) {
      useBorrow.getState().updateAllowance('debt');
    }
    // If the operation happened on the same chain as the wallet, update the balance
    const walletChain = useAuth.getState().chain;
    if (walletChain && hexToChainId(walletChain.id) === s.chainId) {
      updateNativeBalance();
    }
  });
};

// Convenience function to wait for a certain amount of time when polling a cross-chain transaction
export const wait = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
};
