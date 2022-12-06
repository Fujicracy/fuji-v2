import {
  StaticJsonRpcProvider,
  WebSocketProvider,
} from '@ethersproject/providers';
import { IMulticallProvider } from '@hovoh/ethcall';

export type ChainConnectionDetails = {
  rpcProvider: StaticJsonRpcProvider;
  multicallRpcProvider: IMulticallProvider;
  wssProvider?: WebSocketProvider;
};
