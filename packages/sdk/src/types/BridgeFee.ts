import { BigNumber } from 'ethers';

import { Token } from '../entities';

export type BridgeFee = {
  amount: BigNumber;
  token: Token;
  priceUSD: number;
};
