import { BigNumber } from '@ethersproject/bignumber';

export type LendingProviderDetails = {
  name: string;
  borrowRate: BigNumber;
  depositRate: BigNumber;
  active: boolean;
};
