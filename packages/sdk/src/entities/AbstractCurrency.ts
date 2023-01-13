import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider, WebSocketProvider } from '@ethersproject/providers';
import { IMulticallProvider } from '@hovoh/ethcall';
import { Observable } from 'rxjs';
import invariant from 'tiny-invariant';

import { CHAIN } from '../constants/chains';
import { ChainId } from '../enums';
import { ChainConfig } from '../types';
import { Address } from './Address';
import { Currency } from './Currency';
import { StreamManager } from './StreamManager';
import { Token } from './Token';

/**
 * A currency is any fungible financial instrument, including Ether, all ERC20 tokens, and other chain-native currencies
 */
export abstract class AbstractCurrency extends StreamManager {
  /**
   * Returns whether the currency is native to the chain and must be wrapped (e.g. Ether)
   */
  abstract readonly isNative: boolean;
  /**
   * Returns whether the currency is a token that is usable in Uniswap without wrapping
   */
  abstract readonly isToken: boolean;

  /**
   * The chain ID on which this currency resides
   */
  readonly chainId: ChainId;
  /**
   * The decimals used in representing currency amounts
   */
  readonly decimals: number;
  /**
   * The symbol of the currency, i.e. a short textual non-unique identifier
   */
  readonly symbol: string;
  /**
   * The name of the currency, i.e. a descriptive textual non-unique identifier
   */
  readonly name?: string;

  /**
   * The RPC provider for the specific chain
   */
  rpcProvider?: JsonRpcProvider;

  /**
   * The RPC provider for the specific chain
   */
  wssProvider?: WebSocketProvider;

  /**
   * The multicall RPC provider for the specific chain
   */
  multicallRpcProvider?: IMulticallProvider;

  /**
   * Constructs an instance of the base class `BaseCurrency`.
   * @param chainId - the chain ID on which this currency resides
   * @param decimals - decimals of the currency
   * @param symbol - symbol of the currency
   * @param name - name of the currency
   */
  protected constructor(
    chainId: ChainId,
    decimals: number,
    symbol: string,
    name?: string
  ) {
    invariant(
      decimals >= 0 && decimals < 255 && Number.isInteger(decimals),
      'DECIMALS'
    );

    super();

    this.chainId = chainId;
    this.decimals = decimals;
    this.symbol = symbol;
    this.name = name;
  }

  /**
   * Return the wrapped version of this currency that can be used with the Uniswap contracts
   */
  abstract get wrapped(): Token;

  /**
   * Returns whether this currency is functionally equivalent to the other currency
   *
   * @param other - the other currency
   */
  abstract equals(other: Currency): boolean;

  /**
   * Returns currency balance for address
   *
   * @param account - the address of the user, wrapped in class Address
   */
  abstract balanceOf(account: Address): Promise<BigNumber>;

  /**
   * Returns a stream of currency balance for address
   *
   * @param account - the address of the user, wrapped in class Address
   */
  abstract balanceOfStream(account: Address): Observable<BigNumber>;

  /**
   * Returns allowance that an owner has attributed to a spender
   *
   * @param owner - address of currency owner, wrapped in {@link Address}
   * @param spender - address of spender, wrapped in {@link Address}
   *
   * @returns alllowed amount for token, but if currency is native, returns MaxUint256
   */
  abstract allowance(owner: Address, spender: Address): Promise<BigNumber>;

  /**
   * Creates a connection by setting an rpc provider.
   *
   * @param configParams - {@link ChainConfig} object with infura and alchemy ids
   */
  setConnection(configParams: ChainConfig): AbstractCurrency {
    const connection = CHAIN[this.chainId].getConnection(configParams);
    this.rpcProvider = connection.rpcProvider;
    this.wssProvider = connection.wssProvider;
    this.multicallRpcProvider = connection.multicallRpcProvider;

    return this;
  }
}
