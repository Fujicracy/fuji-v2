import {
  StaticJsonRpcProvider,
  WebSocketProvider,
} from '@ethersproject/providers';

import { INFURA_RPC_URL, INFURA_WSS_URL } from '../constants/rpcs';
import { ChainId } from '../enums';
import { ChainConfigParams } from '../types';

type ChainConnectionParams = {
  rpcProvider: StaticJsonRpcProvider;
  wssProvider: WebSocketProvider;
};

export class ChainConnection {
  private static _config: {
    [chainId in ChainId]?: ChainConnectionParams;
  } = {};

  static from(
    params: ChainConfigParams,
    chainId: ChainId
  ): ChainConnectionParams {
    // TODO: add alchemy providers
    if (!this._config[chainId]) {
      const url: string = INFURA_RPC_URL[chainId](params.infuraId);
      const wss: string = INFURA_WSS_URL[chainId](params.infuraId);
      const rpcProvider: StaticJsonRpcProvider = new StaticJsonRpcProvider(url);
      const wssProvider: WebSocketProvider = new WebSocketProvider(
        wss,
        'goerli'
      );

      this._config[chainId] = {
        rpcProvider,
        wssProvider,
      };
    }

    return this._config[chainId] as ChainConnectionParams;
  }
}
