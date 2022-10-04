import { WebSocketProvider } from '@ethersproject/providers';
import { EventFilter } from 'ethers';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import warning from 'tiny-warning';

import { Address } from './Address';

type Stream<T> = {
  data: Observable<T>;
  emitter: BehaviorSubject<string>;
  filters: EventFilter[];
  subsriptions: number;
};

type StreamWrapper<T> = {
  method: string;
  caller: Address;
  stream: Stream<T>;
};

export abstract class StreamManager {
  /* eslint-disable-next-line */
  private _streamWrappers: StreamWrapper<any>[] = [];

  streamFrom<TArgs, TResult>(
    wssProvider: WebSocketProvider,
    method: (...args: TArgs[]) => Promise<TResult>,
    args: TArgs[],
    caller: Address,
    filters: EventFilter[]
  ): Observable<TResult> {
    // if there is already a stream for another caller,
    // remove first its event listeners and reset it
    // to avoid unnecessary calls
    this._cleanup(wssProvider, method.name, caller);

    const streamWrapper = this._streamWrappers.find(
      s => s.method === method.name && caller.equals(s.caller)
    );

    if (streamWrapper) {
      // if there is an active stream for the same account, return it and
      // display warning if there are more than 5 subsriptions
      streamWrapper.stream.subsriptions += 1;
      const count = streamWrapper.stream.subsriptions;
      warning(
        count < 5,
        `FUJI SDK:
          There are already more than ${count} subsriptions to the stream of
          ${method.name}(...args) for ${caller.value}.
          You might be doing something wrong! Consider unsubscribing!!!`
      );

      return streamWrapper.stream.data;
    } else {
      // create new stream
      const newStream = this._createStream(wssProvider, method, args, filters);
      this._streamWrappers.push({
        method: method.name,
        caller,
        stream: newStream,
      });

      return newStream.data;
    }
  }

  private _createStream<TArgs, TResult>(
    wssProvider: WebSocketProvider,
    method: (...args: TArgs[]) => Promise<TResult>,
    args: TArgs[],
    filters: EventFilter[]
  ): Stream<TResult> {
    const emitter = new BehaviorSubject<string>('init');
    const stream = emitter.pipe(switchMap(() => method.apply(this, args)));

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

  private _cleanup(
    wssProvider: WebSocketProvider,
    method: string,
    caller: Address
  ) {
    const wrapper = this._streamWrappers.find(s => s.method === method);

    if (wrapper && !wrapper.caller.equals(caller)) {
      wrapper.stream.emitter.complete();
      wrapper.stream.filters.forEach(f => wssProvider.removeAllListeners(f));

      this._streamWrappers = this._streamWrappers.filter(s => s !== wrapper);
    }
  }
}
