import { BorrowingVault } from '../entities/BorrowingVault';
import { LendingProviderWithFinancials } from './LendingProvider';

export type VaultWithFinancials = {
  vault: BorrowingVault;
  activeProvider: LendingProviderWithFinancials;
  allProviders: LendingProviderWithFinancials[];
};
