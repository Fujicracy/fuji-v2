import { AbstractCurrency } from './AbstractCurrency';
import { Address } from './Address';
import { BigNumber } from '@ethersproject/bignumber';
import { MaxUint256 } from '@ethersproject/constants';

/**
 * Represents the native currency of the chain on which it resides, e.g. ETH, MATIC
 */
export abstract class NativeCurrency extends AbstractCurrency {
  readonly isNative: true = true as const;
  readonly isToken: false = false as const;

  /**
   * {@inheritDoc AbstractCurrency.balanceOf}
   */
  async balanceOf(account: Address): Promise<BigNumber> {
    return this.rpcProvider.getBalance(account.value);
  }

  /**
   * {@inheritDoc AbstractCurrency.allowance}
   */
  async allowance(owner: Address, spender: Address): Promise<BigNumber> {
    /* eslint-disable @typescript-eslint/no-unused-expressions */
    owner;
    spender;
    /* eslint-enable @typescript-eslint/no-unused-expressions */
    return Promise.resolve(MaxUint256);
  }
}
