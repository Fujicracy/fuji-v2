import { EventFilter } from '@ethersproject/abstract-provider';
import { BigNumber } from '@ethersproject/bignumber';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import invariant from 'tiny-invariant';
import warning from 'tiny-warning';

import { ChainId } from '../enums';
import { ChainConfigParams } from '../types';
import { ERC20 as ERC20Contract, ERC20__factory } from '../types/contracts';
import { AbstractCurrency } from './AbstractCurrency';
import { Address } from './Address';
import { ChainConnection } from './ChainConnection';
import { Currency } from './Currency';

/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
export class Token extends AbstractCurrency {
  readonly chainId: ChainId;
  readonly address: Address;

  readonly isNative: false = false as const;
  readonly isToken: true = true as const;

  /**
   * Instance of ethers Contract class, already initialized with address and rpc provider.
   * It's ready to be used by calling the methods available on the smart contract.
   */
  contract?: ERC20Contract;

  currentBalanceStream?: {
    account: Address;
    stream: Observable<BigNumber>;
    emitter: BehaviorSubject<string>;
    fromFilter: EventFilter;
    toFilter: EventFilter;
    subsriptions: number;
  };

  constructor(
    chainId: ChainId,
    address: Address,
    decimals: number,
    symbol: string,
    name?: string
  ) {
    super(chainId, decimals, symbol, name);
    this.chainId = chainId;
    this.address = address;
  }

  /**
   * Return this token, which does not need to be wrapped
   */
  get wrapped(): Token {
    return this;
  }

  /**
   * {@inheritDoc AbstractCurrency.setConnection}
   */
  setConnection(configParams: ChainConfigParams): Token {
    warning(!this.wssProvider, 'Connection already set!');
    if (this.wssProvider) return this;

    const connection = ChainConnection.from(configParams, this.chainId);
    this.rpcProvider = connection.rpcProvider;
    this.wssProvider = connection.wssProvider;

    this.contract = ERC20__factory.connect(
      this.address.value,
      this.rpcProvider
    );

    return this;
  }

  /**
   * {@inheritDoc AbstractCurrency.balanceOf}
   * @throws if {@link setConnection} was not called beforehand
   */
  async balanceOf(account: Address): Promise<BigNumber> {
    invariant(this.contract, 'Connection not set!');
    return this.contract.balanceOf(account.value);
  }

  /**
   * {@inheritDoc AbstractCurrency.balanceOfStream}
   * @throws if {@link setConnection} was not called beforehand
   */
  balanceOfStream(account: Address): Observable<BigNumber> {
    invariant(this.contract && this.wssProvider, 'Connection not set!');

    // if there is already a stream for another account,
    // remove first its event listeners and reset it
    // to avoid unnecessary calls
    if (
      this.currentBalanceStream &&
      !this.currentBalanceStream.account.equals(account)
    ) {
      this.wssProvider.removeAllListeners(
        this.currentBalanceStream?.fromFilter
      );
      this.wssProvider.removeAllListeners(this.currentBalanceStream?.toFilter);
      this.currentBalanceStream.emitter.complete();
      this.currentBalanceStream = undefined;
    }

    // if there is an active stream for the same account, return it and
    // display warning if there are more than 5 subsriptions
    if (this.currentBalanceStream?.account.equals(account)) {
      this.currentBalanceStream.subsriptions += 1;
      const count = this.currentBalanceStream.subsriptions;
      warning(
        count < 5,
        `FUJI SDK: There are already more than ${count} subsriptions to this stream.
        You might be doing something wrong! Consider unsubscribing!!!`
      );

      return this.currentBalanceStream.stream;
    }

    // Create a new stream
    const emitter = new BehaviorSubject<string>('init');
    const stream = emitter.pipe(switchMap(() => this.balanceOf(account)));

    this.currentBalanceStream = {
      account,
      stream,
      emitter,
      subsriptions: 0,
      fromFilter: this.contract.filters.Transfer(account.value),
      toFilter: this.contract.filters.Transfer(null, account.value),
    };

    this.wssProvider.on(this.currentBalanceStream.fromFilter, () => {
      emitter.next('from');
    });
    this.wssProvider.on(this.currentBalanceStream.toFilter, () => {
      emitter.next('to');
    });

    return stream;
  }

  /**
   * {@inheritDoc AbstractCurrency.allowance}
   * @throws if {@link setConnection} was not called
   */
  async allowance(owner: Address, spender: Address): Promise<BigNumber> {
    invariant(this.contract, 'Connection not set!');
    return this.contract.allowance(owner.value, spender.value);
  }

  /**
   * Returns true if the two tokens are equivalent, i.e. have the same chainId and address.
   *
   * @param other - other token to compare
   */
  equals(other: Currency): boolean {
    return (
      other.isToken &&
      this.chainId === other.chainId &&
      this.address === other.address
    );
  }

  /**
   * Returns true if the address of this token sorts before the address of the other token
   *
   * @param other - other token to compare
   * @throws if the tokens have the same address
   * @throws if the tokens are on different chains
   */
  sortsBefore(other: Token): boolean {
    invariant(this.chainId === other.chainId, 'CHAIN_IDS');
    invariant(this.address !== other.address, 'ADDRESSES');
    return this.address.value.toLowerCase() < other.address.value.toLowerCase();
  }
}

/**
 * Compares two currencies for equality
 */
export function currencyEquals(
  currencyA: Currency,
  currencyB: Currency
): boolean {
  if (currencyA instanceof Token && currencyB instanceof Token) {
    return currencyA.equals(currencyB);
  } else if (currencyA instanceof Token) {
    return false;
  } else if (currencyB instanceof Token) {
    return false;
  } else {
    return currencyA === currencyB;
  }
}
