import { BigNumber } from 'ethers';

import { MetaRoutingResult } from './MetaRoutingResult';
import { RouterActionParams } from './RouterActionParams';

export type PreviewResult = MetaRoutingResult & {
  actions: RouterActionParams[];
};

export type PreviewNxtpResult = {
  received: BigNumber;
  estimateSlippage: BigNumber;
  bridgeFee: BigNumber;
};
