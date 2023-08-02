import { BaseContract, BigNumber, CallOverrides } from 'ethers';

export interface AbstractContract extends BaseContract {
  nonces(owner: string, overrides?: CallOverrides): Promise<BigNumber>;
}
