import { BigNumber } from '@ethersproject/bignumber';

import { BridgeFee } from './BridgeFee';
import { RoutingStepDetails } from './RoutingStepDetails';

export type MetaRoutingResult = {
  steps: RoutingStepDetails[];
  bridgeFees: BridgeFee[] | undefined;
  estimateSlippage: BigNumber | undefined;
  estimateTime: number;
};
