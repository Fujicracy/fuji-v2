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
  depositApyBase?: number;
  depositApyReward?: number;
  depositApy?: number;
  depositRewardTokens?: string[];
  borrowApyBase?: number;
  borrowApyReward?: number;
  borrowRewardTokens?: string[];
  availableToBorrowUSD?: number;
};
