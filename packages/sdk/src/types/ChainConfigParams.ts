import { ChainId } from '../enums';

/**
 * @remarks
 * Infura has only one ID for interacting with all available chains
 * but it only exposes web sockets for ethereum. On the other side,
 * Alchemy has both rpc and wss for all chains but it uses different IDs
 * for each chain.
 *
 * Find all chain IDs here: {@link https://chainlist.org/}
 */
export type ChainConfigParams = {
  infuraId: string;
  alchemy: {
    [chainId in ChainId]?: string;
  };
};
