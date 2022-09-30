import { JsonRpcProvider } from '@ethersproject/providers';

import { INFURA_RPC_URL } from '../constants/rpcs';
import { ChainId } from '../enums';
import { ConfigParams } from '../types';

export class Config {
  static rpcProviderFrom(
    params: ConfigParams,
    chainId: ChainId
  ): JsonRpcProvider {
    // TODO: add alchemy providers
    const rpcUrl: string = INFURA_RPC_URL[chainId](params.infuraId);

    return new JsonRpcProvider(rpcUrl);
  }
}
