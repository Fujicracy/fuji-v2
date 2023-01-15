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
import { ChainId, ChainType, ConnextDomain } from '../enums';
import {
  ChainAnkrKey,
  ChainCoingeckoKey,
  ChainLlamaKey,
} from '../enums/ChainKey';
import { ChainConfig } from '../types/ChainConfig';
import { ChainConnectionDetails } from '../types/ChainConnectionDetails';

export class Chain {
  chainId: ChainId;
  chainType: ChainType;

  connextDomain?: ConnextDomain;

  coingeckoKey: ChainCoingeckoKey;
  ankrKey: ChainAnkrKey;
  llamaKey: ChainLlamaKey;

  connection?: ChainConnectionDetails;

  constructor(
    id: ChainId,
    type: ChainType,
    connextDomain: ConnextDomain | undefined,
    coingecko: ChainCoingeckoKey,
    ankr: ChainAnkrKey,
    llama: ChainLlamaKey
  ) {
    this.chainId = id;
    this.chainType = type;

    this.connextDomain = connextDomain;

    this.coingeckoKey = coingecko;
    this.ankrKey = ankr;
    this.llamaKey = llama;
  }

  /**
   * Sets a rpc and a wss for a specific chain if it's not already done.
   *
   * @remarks
   * Infura has only one ID for interacting with all available chains
   * but it only exposes web sockets for ethereum. On the other side,
   * Alchemy has both rpc and wss for all chains but it uses different IDs
   * for each chain.
   *
   * Defaults to Infura but for missing web socket endpoints, uses Alchemy.
   */
  setConnection(params: ChainConfig): Chain {
    if (!this.connection) {
      const url: string = INFURA_RPC_URL[this.chainId](params.infuraId);
      const rpcProvider: StaticJsonRpcProvider = new StaticJsonRpcProvider(url);

      const multicallRpcProvider: IMulticallProvider =
        initSyncMulticallProvider(rpcProvider, this.chainId);

      let wss: string | null = INFURA_WSS_URL[this.chainId](params.infuraId);
      if (!wss) {
        const alchemyId = params.alchemy[this.chainId];
        wss = alchemyId ? ALCHEMY_WSS_URL[this.chainId](alchemyId) : null;
      }
      const wssProvider = wss ? new WebSocketProvider(wss) : undefined;

      this.connection = {
        rpcProvider,
        multicallRpcProvider,
        wssProvider,
      };
    }

    return this;
  }
}
