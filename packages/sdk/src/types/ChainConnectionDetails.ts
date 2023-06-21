import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { IMulticallProvider } from '@hovoh/ethcall';

export type ChainConnectionDetails = {
  rpcProvider: StaticJsonRpcProvider;
  multicallRpcProvider: IMulticallProvider;
};
