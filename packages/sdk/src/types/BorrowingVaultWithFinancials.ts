import { BorrowingVault } from '../entities/BorrowingVault';

export type BorrowingVaultWithFinancials = {
  vault: BorrowingVault;
  depositApyBase: number;
  depositApyReward: number;
  depositApy: number;
  depositRewardTokens: string[];
  borrowApyBase: number;
  borrowApyReward: number;
  borrowRewardTokens: string[];
  availableToBorrowUSD: number;
};
