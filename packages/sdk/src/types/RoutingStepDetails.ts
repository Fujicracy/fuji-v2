import { BigNumber } from '@ethersproject/bignumber';

import { Token } from '../entities/Token';
import { ChainId, RoutingStep } from '../enums';
import { LendingProviderDetails } from './LendingProviderDetails';

/**
 * @remarks
 * `chainId` is the chain where the action will be performed.
 * For a "bridge" step, we have two chains: source and destination.
 * In that case, `chainId` is the source chain ID and `token.chainId`
 * is the destination chain ID.
 */
export type RoutingStepDetails = {
  step: RoutingStep;
  chainId: ChainId;
  amount?: BigNumber;
  token?: Token;
  txHash?: Promise<string>;
  lendingProvider?: LendingProviderDetails;
};
