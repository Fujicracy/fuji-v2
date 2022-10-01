import { BigNumber } from '@ethersproject/bignumber';
import { MaxUint256 } from '@ethersproject/constants';
import { from, Observable, of } from 'rxjs';
import { distinctUntilKeyChanged, switchMap } from 'rxjs/operators';
import invariant from 'tiny-invariant';

import { AbstractCurrency } from './AbstractCurrency';
import { Address } from './Address';

/**
 * Represents the native currency of the chain on which it resides, e.g. ETH, MATIC
 */
export abstract class NativeCurrency extends AbstractCurrency {
  readonly isNative: true = true as const;
  readonly isToken: false = false as const;

  /**
   * {@inheritDoc AbstractCurrency.balanceOf}
   * @throws if {@link AbstractCurrency.setConnection} was not called
   */
  async balanceOf(account: Address): Promise<BigNumber> {
    invariant(this.rpcProvider, 'Connection not set!');

    return this.rpcProvider.getBalance(account.value);
  }

  /**
   * {@inheritDoc AbstractCurrency.balanceOfStream}
   * @throws if {@link AbstractCurrency.setConnection} was not called
   */
  balanceOfStream(account: Address): Observable<BigNumber> {
    invariant(this.blockStream, 'Connection not set!');
    const balance = () =>
      this.rpcProvider
        ? this.rpcProvider.getBalance(account.value)
        : of(BigNumber.from(0));

    return this.blockStream.pipe(
      switchMap(() => from(balance())),
      distinctUntilKeyChanged('_hex')
    );
  }

  /**
   * {@inheritDoc AbstractCurrency.allowance}
   */
  async allowance(_owner: Address, _spender: Address): Promise<BigNumber> {
    return Promise.resolve(MaxUint256);
  }
}
