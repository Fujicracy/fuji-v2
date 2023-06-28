import {
  BorrowingVault,
  ChainId,
  LendingVault,
  RoutingStep,
  RoutingStepDetails,
  VaultType,
} from '@x-fuji/sdk';
import { BigNumber } from 'ethers';

import { useBorrow } from '../store/borrow.store';
import { AssetType } from './assets';
import { updateNativeBalance } from './balances';

export type HistoryTransaction = {
  address: string;
  hash: string;
};

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
  isNative: boolean;
};

export type HistoryEntryChain = {
  chainId: ChainId;
  status: HistoryEntryStatus;
  hash?: string;
  shown?: boolean; // If the user reloads the page while executing a cross-chain tx, without this prop we show the initial notification again
};

export type HistoryEntryConnext = {
  transferId: string;
  timestamp: number;
  secondTransferId?: string;
  secondTimestamp?: number;
};

export type HistoryEntry = {
  type?: VaultType; // Default to borrow
  hash: string;
  address: string;
  steps: HistoryRoutingStep[];
  status: HistoryEntryStatus;
  connext?: HistoryEntryConnext;
  vaultAddress?: string;
  vaultChainId?: ChainId;
  sourceChain: HistoryEntryChain;
  chainCount: number;
  secondChain?: HistoryEntryChain;
  thirdChain?: HistoryEntryChain;
  error?: string;
};

export type HistoryRoutingStep = Omit<RoutingStepDetails, 'token'> & {
  token?: SerializableToken;
  destinationChainId?: number;
  connextLink?: string;
  bridgeResultAmount?: BigNumber;
};

export const isValidStep = (step: HistoryRoutingStep): boolean => {
  return Boolean(
    step.step !== RoutingStep.START &&
      step.step !== RoutingStep.END &&
      step.token &&
      step.amount
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
            isNative: s.token.isNative,
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
    useBorrow.getState().updateBalances(AssetType.Collateral);
  }
  if (hasDebtStep) {
    useBorrow.getState().updateBalances(AssetType.Debt);
  }
  if (hasDepositStep) {
    useBorrow.getState().updateAllowance(AssetType.Collateral);
  } else if (hasPaybackStep) {
    useBorrow.getState().updateAllowance(AssetType.Debt);
  }
  updateNativeBalance();
};

export const chainCompleted = (chain: HistoryEntryChain) => {
  return (
    chain.status === HistoryEntryStatus.SUCCESS ||
    chain.status === HistoryEntryStatus.FAILURE
  );
};

export const stepForFinishing = (entry: HistoryEntry) => {
  if (entry.chainCount === 3 && entry.secondChain) {
    return chainCompleted(entry.secondChain)
      ? 2
      : chainCompleted(entry.sourceChain)
      ? 1
      : 0;
  } else if (entry.chainCount === 2) {
    return chainCompleted(entry.sourceChain) ? 1 : 0;
  }
  return 0;
};

export const isVaultTheCurrentPosition = (
  entry: HistoryEntry,
  borrowActiveVault: BorrowingVault | undefined,
  lendingActiveVault: LendingVault | undefined
): boolean => {
  const isCurrentPosition =
    entry.vaultChainId !== undefined
      ? (borrowActiveVault?.address.value === entry.vaultAddress &&
          borrowActiveVault?.chainId === entry.vaultChainId) ||
        (lendingActiveVault?.address.value === entry.vaultAddress &&
          lendingActiveVault?.chainId === entry.vaultChainId)
      : borrowActiveVault?.address.value === entry.vaultAddress ||
        lendingActiveVault?.address.value === entry.vaultAddress;

  return isCurrentPosition;
};

const connextLinkify = (id: string) => `https://amarok.connextscan.io/tx/${id}`;

export const connextLinksForEntry = (entry: HistoryEntry) => {
  const links: undefined | string[] = entry.connext && [
    connextLinkify(entry.connext.transferId),
  ];
  if (links && entry.connext?.secondTransferId) {
    links.push(connextLinkify(entry.connext.secondTransferId));
  }
  return links;
};

// Convenience function to wait for a certain amount of time when polling a cross-chain transaction
export const wait = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
};
