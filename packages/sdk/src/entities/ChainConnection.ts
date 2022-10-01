import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Observable, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { INFURA_RPC_URL } from '../constants/rpcs';
import { ChainId } from '../enums';
import { ChainConfigParams } from '../types';

type ChainConnectionParams = {
  rpcProvider: StaticJsonRpcProvider;
  blockStream: Observable<number>;
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
      const blockStream: Subject<number> = new Subject<number>();
      const rpcProvider: StaticJsonRpcProvider = new StaticJsonRpcProvider(url);

      rpcProvider.on('block', block => {
        console.log(block);
        blockStream.next(block);
      });
      this._config[chainId] = {
        rpcProvider,
        blockStream: blockStream.pipe(shareReplay(1)),
      };
    }

    return this._config[chainId] as ChainConnectionParams;
  }
}
