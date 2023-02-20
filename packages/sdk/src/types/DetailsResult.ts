import { BigNumber } from '@ethersproject/bignumber';

import { RoutingStepDetails } from './RoutingStepDetails';

export type DetailsResult = {
  steps: RoutingStepDetails[];
  bridgeFee: BigNumber;
  estimateSlippage: BigNumber;
  estimateTime: number;
};
