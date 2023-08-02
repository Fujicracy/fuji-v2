import { BigNumber } from '@ethersproject/bignumber';
import { MaxUint256 } from '@ethersproject/constants';
import invariant from 'tiny-invariant';

import { ChainConfig } from '../types/ChainConfig';
import { AbstractCurrency } from './abstract/AbstractCurrency';
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
   * {@inheritDoc AbstractCurrency.allowance}
   */
  async allowance(_owner: Address, _spender: Address): Promise<BigNumber> {
    return Promise.resolve(MaxUint256);
  }

  /**
   * {@inheritDoc AbstractCurrency._setConnection}
   */
  setConnection(configParams: ChainConfig): NativeCurrency {
    if (this.rpcProvider) return this;

    super._setConnection(configParams);
    invariant(this.rpcProvider, 'Something went wrong with setting connection');

    return this;
  }
}
