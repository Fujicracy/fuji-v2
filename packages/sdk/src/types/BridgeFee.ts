import { BigNumber } from 'ethers';

import { Token } from '../entities';

export type BridgeFee = {
  amount: number;
  token: Token;
  priceUSD: BigNumber;
};
