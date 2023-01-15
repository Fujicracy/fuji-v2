import AnkrProvider from '@ankr.com/ankr.js';
import { Blockchain } from '@ankr.com/ankr.js/dist/types';
import { BigNumber } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';
import { formatUnits } from '@ethersproject/units';
import { Observable } from 'rxjs';
import invariant from 'tiny-invariant';

import { FUJI_ORACLE_ADDRESS } from '../constants/addresses';
import { CHAIN } from '../constants/chains';
import { ChainId } from '../enums';
import { ChainConfig } from '../types';
import {
  ERC20 as ERC20Contract,
  ERC20__factory,
  FujiOracle__factory,
} from '../types/contracts';
import { ERC20Multicall } from '../types/contracts/lib/openzeppelin-contracts/contracts/token/ERC20/ERC20';
import { AbstractCurrency } from './AbstractCurrency';
import { Address } from './Address';
import { Currency } from './Currency';

/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
export class Token extends AbstractCurrency {
  readonly address: Address;

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
    super(chainId, decimals, symbol, name);
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
  setConnection(configParams: ChainConfig): Token {
    if (this.rpcProvider) return this;

    super.setConnection(configParams);
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
   * {@inheritDoc AbstractCurrency.balanceOfStream}
   * @throws if {@link setConnection} was not called beforehand
   */
  balanceOfStream(account: Address): Observable<BigNumber> {
    invariant(this.contract && this.wssProvider, 'Connection not set!');

    const filters = [
      this.contract.filters.Transfer(account.value),
      this.contract.filters.Transfer(null, account.value),
    ];
    return this.streamFrom<Address, BigNumber>(
      this.wssProvider,
      this.balanceOf,
      [account],
      account,
      filters
    );
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
   * Fetch token price in USD from Ankr rpc and returns it.
   */
  async getPriceUSD(): Promise<number> {
    // handle testnets differently because they are not available on Ankr
    if (
      [ChainId.GOERLI, ChainId.OPTIMISM_GOERLI, ChainId.MATIC_MUMBAI].includes(
        this.chainId
      )
    ) {
      invariant(this.rpcProvider, 'Connection not set!');
      return FujiOracle__factory.connect(
        FUJI_ORACLE_ADDRESS[this.chainId].value,
        this.rpcProvider
      )
        .getPriceOf(this.address.value, AddressZero, this.decimals)
        .then((price) =>
          parseFloat(formatUnits(price.toString(), this.decimals))
        );
    }

    const provider = new AnkrProvider();
    return provider
      .getTokenPrice({
        blockchain: CHAIN[this.chainId].ankrKey as Blockchain,
        contractAddress: this.address.value,
      })
      .then(({ usdPrice }) => parseFloat(usdPrice));
  }

  /**
   * Returns allowance that an owner has attributed to a spender as stream
   *
   * @param owner - address of currency owner, wrapped in {@link Address}
   * @param spender - address of spender, wrapped in {@link Address}
   *
   * @throws if {@link setConnection} was not called beforehand
   */
  allowanceStream(owner: Address, spender: Address): Observable<BigNumber> {
    invariant(this.contract && this.wssProvider, 'Connection not set!');

    const filters = [this.contract.filters.Approval(owner.value)];
    return this.streamFrom<Address, BigNumber>(
      this.wssProvider,
      this.allowance,
      [owner, spender],
      owner,
      filters
    );
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
