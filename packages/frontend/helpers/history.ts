import { ChainId, RoutingStep, RoutingStepDetails } from '@x-fuji/sdk';

import { useBorrow } from '../store/borrow.store';
import { updateNativeBalance } from './balances';

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

export const triggerUpdatesFromSteps = (steps: HistoryRoutingStep[]) => {
  // We could check the chain id and only trigger updates when the operation is done
  // on a particular chain, but it doesn't hurt to do it twice just in case considering confirmations
  const hasDepositStep = steps.some((s) => s.step === RoutingStep.DEPOSIT);
  const hasPaybackStep = steps.some((s) => s.step === RoutingStep.PAYBACK);
  const hasCollateralStep =
    hasDepositStep || steps.some((s) => s.step === RoutingStep.WITHDRAW);
  const hasDebtStep =
    steps.find((s) => s.step === RoutingStep.BORROW) || hasPaybackStep;

  if (hasCollateralStep) {
    useBorrow.getState().updateBalances('collateral');
  }
  if (hasDebtStep) {
    useBorrow.getState().updateBalances('debt');
  }
  if (hasDepositStep) {
    useBorrow.getState().updateAllowance('collateral');
  } else if (hasPaybackStep) {
    useBorrow.getState().updateAllowance('debt');
  }
  updateNativeBalance();
};

// Convenience function to wait for a certain amount of time when polling a cross-chain transaction
export const wait = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
};
