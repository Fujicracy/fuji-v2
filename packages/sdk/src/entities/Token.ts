import { BigNumber } from '@ethersproject/bignumber';
import invariant from 'tiny-invariant';

import { ChainId } from '../enums';
import { ChainConfig } from '../types';
import { ERC20 as ERC20Contract, ERC20__factory } from '../types/contracts';
import { ERC20Multicall } from '../types/contracts/lib/openzeppelin-contracts/contracts/token/ERC20/ERC20';
import { AbstractCurrency } from './abstract/AbstractCurrency';
import { Address } from './Address';
import { Currency } from './Currency';

/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
export class Token extends AbstractCurrency {
  readonly isNative: false = false as const;
  readonly isToken: true = true as const;

  /**
   * Instance of ethers Contract class, already initialized with address and rpc provider.
   * It's ready to be used by calling the methods available on the smart contract.
   */
  contract?: ERC20Contract;

  /**
   * Extended instance of ERC20 contract used when there is a
   * possibility to perform a multicall read on the smart contract.
   * @remarks
   * A multicall read refers to a batch read done in a single call.
   */
  multicallContract?: ERC20Multicall;

  constructor(
    chainId: ChainId,
    address: Address,
    decimals: number,
    symbol: string,
    name?: string
  ) {
    super(address, chainId, decimals, symbol, name);
  }

  /**
   * Return this token, which does not need to be wrapped
   */
  get wrapped(): Token {
    return this;
  }

  /**
   * {@inheritDoc AbstractCurrency._setConnection}
   */
  setConnection(configParams: ChainConfig): Token {
    if (this.rpcProvider) return this;

    super._setConnection(configParams);
    invariant(this.rpcProvider, 'Something went wrong with setting connection');

    this.contract = ERC20__factory.connect(
      this.address.value,
      this.rpcProvider
    );

    this.multicallContract = ERC20__factory.multicall(this.address.value);

    return this;
  }

  /**
   * {@inheritDoc AbstractCurrency.balanceOf}
   * @throws if {@link setConnection} was not called beforehand
   */
  balanceOf(account: Address): Promise<BigNumber> {
    invariant(this.contract, 'Connection not set!');
    return this.contract.balanceOf(account.value);
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
