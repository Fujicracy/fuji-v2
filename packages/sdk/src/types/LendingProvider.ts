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
