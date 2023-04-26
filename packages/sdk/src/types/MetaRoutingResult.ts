import { BigNumber } from '@ethersproject/bignumber';

import { RoutingStepDetails } from './RoutingStepDetails';

export type MetaRoutingResult = {
  steps: RoutingStepDetails[];
  bridgeFees: BigNumber[];
  estimateSlippage: BigNumber;
  estimateTime: number;
};
