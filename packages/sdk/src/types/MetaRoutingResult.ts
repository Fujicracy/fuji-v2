import { BigNumber } from '@ethersproject/bignumber';

import { RoutingStepDetails } from './RoutingStepDetails';

export type MetaRoutingResult = {
  steps: RoutingStepDetails[];
  bridgeFee: BigNumber;
  estimateSlippage: BigNumber;
  estimateTime: number;
};
