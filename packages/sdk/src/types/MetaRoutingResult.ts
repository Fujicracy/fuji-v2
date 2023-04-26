import { BigNumber } from '@ethersproject/bignumber';

import { RoutingStepDetails } from './RoutingStepDetails';

export type MetaRoutingResult = {
  steps: RoutingStepDetails[];
  bridgeFees: BigNumber[] | undefined;
  estimateSlippage: BigNumber | undefined;
  estimateTime: number;
};
