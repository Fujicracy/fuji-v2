import { BigNumber } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';
import { JsonRpcProvider, WebSocketProvider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { IMulticallProvider } from '@hovoh/ethcall';
import invariant from 'tiny-invariant';

import { TOKEN_CACHE_TIMEOUT } from '../constants';
import { FUJI_ORACLE_ADDRESS, WNATIVE_ADDRESS } from '../constants/addresses';
import { CHAIN } from '../constants/chains';
import { ChainId } from '../enums';
import {
  ChainConfig,
  ChainConnectionDetails,
  FujiResultPromise,
} from '../types';
import { FujiOracle__factory } from '../types/contracts/factories/src/FujiOracle__factory';
import { Address } from './Address';
import { Chain } from './Chain';
import { Currency } from './Currency';
import { FujiResultError, FujiResultSuccess } from './FujiError';
import { Token } from './Token';

/**
 * A currency is any fungible financial instrument, including Ether, all ERC20 tokens, and other chain-native currencies
 */
export abstract class AbstractCurrency {
  /**
   * Returns whether the currency is native to the chain and must be wrapped (e.g. Ether)
   */
  abstract readonly isNative: boolean;
  /**
   * Returns whether the currency is a token that is usable in Uniswap without wrapping
   */
  abstract readonly isToken: boolean;

  readonly address: Address;

  /**
   * The chain ID on which this currency resides
   */
  readonly chainId: ChainId;

  /**
   * The chain ID on which this currency resides
   */
  readonly chain: Chain;

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
   * Timestamp when the last price was updated
   */
  cacheTimestamp?: number;

  /**
   * Last price in USD
   */
  lastPriceUSD?: number;

  /**
   * Constructs an instance of the base class `BaseCurrency`.
   * @param address - the address of the currency
   * @param chainId - the chain ID on which this currency resides
   * @param decimals - decimals of the currency
   * @param symbol - symbol of the currency
   * @param name - name of the currency
   */
  protected constructor(
    address: Address,
    chainId: ChainId,
    decimals: number,
    symbol: string,
    name?: string
  ) {
    invariant(
      decimals >= 0 && decimals < 255 && Number.isInteger(decimals),
      'DECIMALS'
    );

    this.address = address;
    this.chainId = chainId;
    this.chain = CHAIN[this.chainId];
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
   * Returns allowance that an owner has attributed to a spender
   *
   * @param owner - address of currency owner, wrapped in {@link Address}
   * @param spender - address of spender, wrapped in {@link Address}
   *
   * @returns allowed amount for token, but if currency is native, returns MaxUint256
   */
  abstract allowance(owner: Address, spender: Address): Promise<BigNumber>;

  /**
   * Fetch currency price in USD.
   */
  async getPriceUSD(latest = false): FujiResultPromise<number> {
    if (!this.rpcProvider) {
      return new FujiResultError('Connection not set!');
    }
    if (
      !latest &&
      this.lastPriceUSD &&
      this.cacheTimestamp &&
      Date.now() - this.cacheTimestamp < TOKEN_CACHE_TIMEOUT
    ) {
      return new FujiResultSuccess(this.lastPriceUSD);
    }
    const addr = this.isNative ? WNATIVE_ADDRESS[this.chainId] : this.address;

    try {
      const result = await FujiOracle__factory.connect(
        FUJI_ORACLE_ADDRESS[this.chainId].value,
        this.rpcProvider
      )
        .getPriceOf(AddressZero, addr.value, this.decimals)
        .then((price) =>
          parseFloat(formatUnits(price.toString(), this.decimals))
        );

      this.cacheTimestamp = Date.now();
      this.lastPriceUSD = result;
      return new FujiResultSuccess(result);
    } catch (error) {
      return new FujiResultError('Error getting token USD price');
    }
  }

  /**
   * Creates a connection by setting an rpc provider.
   *
   * @param configParams - {@link ChainConfig} object with infura and alchemy ids
   */
  protected _setConnection(configParams: ChainConfig): AbstractCurrency {
    const connection = CHAIN[this.chainId].setConnection(configParams)
      .connection as ChainConnectionDetails;

    this.rpcProvider = connection.rpcProvider;
    this.wssProvider = connection.wssProvider;
    this.multicallRpcProvider = connection.multicallRpcProvider;

    return this;
  }
}
