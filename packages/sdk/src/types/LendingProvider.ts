import { BigNumber } from '@ethersproject/bignumber';

// TODO: deprecate
export type LendingProviderDetails = {
  name: string;
  borrowRate: BigNumber;
  depositRate: BigNumber;
  active: boolean;
};

export type LendingProviderBase = {
  name: string;
  llamaKey: string;
};

export type LendingProviderWithFinancials = LendingProviderBase & {
  depositAprBase?: number;
  depositAprReward?: number;
  depositApr?: number;
  depositRewardTokens?: string[];
  borrowAprBase?: number;
  borrowAprReward?: number;
  borrowRewardTokens?: string[];
  availableToBorrowUSD?: number;
};
