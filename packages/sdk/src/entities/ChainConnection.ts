import { BigNumber } from '@ethersproject/bignumber';
import {
  StaticJsonRpcProvider,
  WebSocketProvider,
} from '@ethersproject/providers';
import { EventFilter } from 'ethers';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import invariant from 'tiny-invariant';
import warning from 'tiny-warning';

import { INFURA_RPC_URL, INFURA_WSS_URL } from '../constants/rpcs';
import { ChainId } from '../enums';
import { ChainConfigParams } from '../types';
import { Address } from './Address';

type ChainConnectionParams = {
  rpcProvider: StaticJsonRpcProvider;
  wssProvider: WebSocketProvider;
};

type Stream = {
  data: Observable<BigNumber>;
  emitter: BehaviorSubject<string>;
  filters: EventFilter[];
  subsriptions: number;
};

type StreamWrapper = {
  contract: IContract;
  method: string;
  caller: Address;
  stream: Stream;
};

interface IContract {
  chainId: ChainId;
  address: Address;
}

export class ChainConnection {
  private static _config: {
    [chainId in ChainId]?: ChainConnectionParams;
  } = {};

  private static _streams: StreamWrapper[] = [];

  static from(
    params: ChainConfigParams,
    chainId: ChainId
  ): ChainConnectionParams {
    // TODO: add alchemy providers
    if (!this._config[chainId]) {
      const url: string = INFURA_RPC_URL[chainId](params.infuraId);
      const wss: string = INFURA_WSS_URL[chainId](params.infuraId);
      const rpcProvider: StaticJsonRpcProvider = new StaticJsonRpcProvider(url);
      const wssProvider: WebSocketProvider = new WebSocketProvider(wss);

      this._config[chainId] = {
        rpcProvider,
        wssProvider,
      };
    }

    return this._config[chainId] as ChainConnectionParams;
  }

  static streamFor(
    contract: IContract,
    method: string,
    caller: Address,
    filters: EventFilter[],
    call: () => Promise<BigNumber>
  ): Observable<BigNumber> {
    const wssProvider = this._config[contract.chainId]?.wssProvider;
    invariant(wssProvider, 'Connection not set!');

    // if there is already a stream for another account,
    // remove first its event listeners and reset it
    // to avoid unnecessary calls
    this._cleanup(wssProvider, contract, method, caller);

    const streamWrapper = this._streams.find(
      (s: StreamWrapper) =>
        s.contract === contract &&
        s.method === method &&
        caller.equals(s.caller)
    );

    if (streamWrapper) {
      // if there is an active stream for the same account, return it and
      // display warning if there are more than 5 subsriptions
      streamWrapper.stream.subsriptions += 1;
      const count = streamWrapper.stream.subsriptions;
      warning(
        count < 5,
        `FUJI SDK: There are already more than ${count} subsriptions to this stream.
          You might be doing something wrong! Consider unsubscribing!!!`
      );

      return streamWrapper.stream.data;
    } else {
      // create new stream
      const newStream = this._createStream(wssProvider, call, filters);
      this._streams.push({
        contract,
        method,
        caller,
        stream: newStream,
      });

      return newStream.data;
    }
  }

  private static _createStream(
    wssProvider: WebSocketProvider,
    call: () => Promise<BigNumber>,
    filters: EventFilter[]
  ): Stream {
    const emitter = new BehaviorSubject<string>('init');
    const stream = emitter.pipe(switchMap(() => call()));

    filters.forEach(f => {
      wssProvider.on(f, () => emitter.next('next'));
    });

    return {
      emitter,
      filters,
      data: stream,
      subsriptions: 0,
    };
  }

  private static _cleanup(
    wssProvider: WebSocketProvider,
    contract: IContract,
    method: string,
    caller: Address
  ) {
    const wrapper = this._streams.find(
      (s: StreamWrapper) => s.contract === contract && s.method === method
    );

    if (wrapper && !wrapper.caller.equals(caller)) {
      wrapper.stream.emitter.complete();
      wrapper.stream.filters.forEach(f => wssProvider.removeAllListeners(f));

      this._streams = this._streams.filter(s => s !== wrapper);
    }
  }
}
