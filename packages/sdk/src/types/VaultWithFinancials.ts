import { BigNumber } from '@ethersproject/bignumber';

import { BorrowingVault } from '../entities/BorrowingVault';
import { LendingProviderWithFinancials } from './LendingProvider';

export type VaultWithFinancials = {
  vault: BorrowingVault;
  depositBalance: BigNumber;
  borrowBalance?: BigNumber;
  collateralPriceUSD: BigNumber;
  debtPriceUSD?: BigNumber;
  activeProvider: LendingProviderWithFinancials;
  allProviders: LendingProviderWithFinancials[];
};
