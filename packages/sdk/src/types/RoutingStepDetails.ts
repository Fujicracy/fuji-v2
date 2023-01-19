import { BigNumber } from '@ethersproject/bignumber';

import { Token } from '../entities/Token';
import { ChainId, RoutingStep } from '../enums';
import { LendingProviderDetails } from './LendingProviderDetails';

export type RoutingStepDetails = {
  step: RoutingStep;
  chainId: ChainId;
  amount?: BigNumber;
  token?: Token;
  txHash?: Promise<string>;
  lendingProvider?: LendingProviderDetails;
};
