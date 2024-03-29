import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { IMulticallProvider, initSyncMulticallProvider } from '@hovoh/ethcall';

import {
  CHAIN_BLOCK_EXPLORER_URL,
  CHAIN_COINGECKO_KEY,
  CHAIN_LLAMA_KEY,
  CHAIN_NAME,
} from '../constants/chain-properties';
import { INFURA_RPC_URL, POKT_RPC_URL } from '../constants/rpcs';
import { ChainId, ChainType, ConnextDomain } from '../enums';
import { ChainConfig } from '../types/ChainConfig';
import { ChainConnectionDetails } from '../types/ChainConnectionDetails';

export class Chain {
  chainId: ChainId;
  chainType: ChainType;

  connextDomain?: ConnextDomain;

  coingeckoKey: string;
  llamaKey: string;

  isDeployed: boolean;

  connection?: ChainConnectionDetails;

  name: string; // Convenience property
  blockExplorerUrl: string; // Convenience property

  constructor(
    id: ChainId,
    type: ChainType,
    connextDomain: ConnextDomain | undefined,
    isDeployed?: boolean
  ) {
    this.chainId = id;
    this.chainType = type;

    this.connextDomain = connextDomain;

    this.isDeployed = isDeployed as boolean;

    this.coingeckoKey = CHAIN_COINGECKO_KEY[id];
    this.llamaKey = CHAIN_LLAMA_KEY[id];

    this.name = CHAIN_NAME[id];
    this.blockExplorerUrl = CHAIN_BLOCK_EXPLORER_URL[id];
  }

  getConnextDomain(): string {
    return this.connextDomain?.toString() ?? '';
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
      const url = params.poktId
        ? POKT_RPC_URL[this.chainId](params.poktId)
        : INFURA_RPC_URL[this.chainId](params.infuraId);

      const rpcProvider: StaticJsonRpcProvider = new StaticJsonRpcProvider(url);

      const multicallRpcProvider: IMulticallProvider =
        initSyncMulticallProvider(rpcProvider, this.chainId);

      this.connection = {
        rpcProvider,
        multicallRpcProvider,
      };
    }

    return this;
  }
}
