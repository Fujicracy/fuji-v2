import { BigNumber } from '@ethersproject/bignumber';

import { AbstractVault } from '../entities/abstract/AbstractVault';
import { LendingProviderWithFinancials } from './LendingProvider';

export type VaultWithFinancials = {
  vault: AbstractVault;
  depositBalance: BigNumber;
  borrowBalance?: BigNumber;
  collateralPriceUSD: BigNumber;
  debtPriceUSD?: BigNumber;
  activeProvider: LendingProviderWithFinancials;
  allProviders: LendingProviderWithFinancials[];
};
