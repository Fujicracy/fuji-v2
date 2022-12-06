import {
  StaticJsonRpcProvider,
  WebSocketProvider,
} from '@ethersproject/providers';
import { IMulticallProvider, initSyncMulticallProvider } from '@hovoh/ethcall';

import {
  ALCHEMY_WSS_URL,
  INFURA_RPC_URL,
  INFURA_WSS_URL,
} from '../constants/rpcs';
import { ChainId } from '../enums';
import { ChainConfig, ChainConnectionDetails } from '../types';

export class ChainConnection {
  private static _config: {
    [chainId in ChainId]?: ChainConnectionDetails;
  } = {};

  /**
   * Returns a rpc and a wss for a specific chain.
   *
   * @remarks
   * Infura has only one ID for interacting with all available chains
   * but it only exposes web sockets for ethereum. On the other side,
   * Alchemy has both rpc and wss for all chains but it uses different IDs
   * for each chain.
   *
   * Defaults to Infura but for missing web socket endpoints, uses Alchemy.
   */
  static from(params: ChainConfig, chainId: ChainId): ChainConnectionDetails {
    if (!this._config[chainId]) {
      const url: string = INFURA_RPC_URL[chainId](params.infuraId);
      const rpcProvider: StaticJsonRpcProvider = new StaticJsonRpcProvider(url);

      const multicallRpcProvider: IMulticallProvider =
        initSyncMulticallProvider(rpcProvider, chainId);

      let wss: string | null = INFURA_WSS_URL[chainId](params.infuraId);
      if (!wss) {
        const alchemyId = params.alchemy[chainId];
        wss = alchemyId ? ALCHEMY_WSS_URL[chainId](alchemyId) : null;
      }
      const wssProvider = wss ? new WebSocketProvider(wss) : undefined;

      this._config[chainId] = {
        rpcProvider,
        multicallRpcProvider,
        wssProvider,
      };
    }

    return this._config[chainId] as ChainConnectionDetails;
  }
}
