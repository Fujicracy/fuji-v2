import { BigNumber } from '@ethersproject/bignumber';

import { ChainId, RoutingStep } from '../enums';
import { LendingProviderDetails } from './LendingProviderDetails';

export type RoutingStepDetails = {
  step: RoutingStep;
  amount: BigNumber;
  chainId: ChainId;
  tokenSym: string;
  lendingProvider?: LendingProviderDetails;
};
