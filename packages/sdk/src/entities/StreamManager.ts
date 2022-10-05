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

/**
 * Abstract class that creates and manages streams of observables.
 *
 * @remarks
 * If subscriptions aren't managed properly on client's side, this may incur
 * significant costs on services providing rpc and wss endpoints (Infura, Alchemy, ...).
 * That's why it's highly recommended to *unsubscribing * from streams that are
 * not used anymore
 */

export abstract class StreamManager {
  /* eslint-disable-next-line */
  private _streamWrappers: StreamWrapper<any>[] = [];

  /**
   * Creates a stream from a method returning a promise on the parent class.
   *
   * @remarks
   * Keeps only one stream per method. If there is a request for a stream for the
   * same method but with a different caller, it desactivates the previous stream.
   *
   * @param wssProvider - instance of WebSocketProvider
   * @param method - method that MUST exist on the calling contract
   * @param args - the arguments with which "method" will be called
   * @param caller - user address, wrapped in {@link Address}, used to keep track on subsriptions
   * @param filters - events on which the subsription is created
   */
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
      // if there is an active stream for the same caller, return it and
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
