import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider } from '@ethersproject/providers';
import invariant from 'tiny-invariant';

import { RPC_PROVIDER } from '../constants/rpcs';
import { ChainId } from '../enums';
import { Address } from './Address';
import { Currency } from './Currency';
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
   * The RPC provider for the specific chain
   */
  readonly rpcProvider: JsonRpcProvider;
  /**
   * The name of the currency, i.e. a descriptive textual non-unique identifier
   */
  readonly name?: string;

  /**
   * Constructs an instance of the base class `BaseCurrency`.
   * @param chainId - the chain ID on which this currency resides
   * @param decimals - decimals of the currency
   * @param symbol - symbol of the currency
   * @param name - name of the currency
   */
  protected constructor(
    chainId: number,
    decimals: number,
    symbol: string,
    name?: string
  ) {
    invariant(Number.isSafeInteger(chainId), 'CHAIN_ID');
    invariant(
      decimals >= 0 && decimals < 255 && Number.isInteger(decimals),
      'DECIMALS'
    );

    this.chainId = chainId;
    this.decimals = decimals;
    this.symbol = symbol;
    this.rpcProvider = RPC_PROVIDER[this.chainId];
    this.name = name;
  }

  /**
   * Return the wrapped version of this currency that can be used with the Uniswap contracts
   */
  abstract get wrapped(): Token;

  /**
   * Returns whether this currency is functionally equivalent to the other currency
   * @param other - the other currency
   */
  abstract equals(other: Currency): boolean;

  /**
   * Returns currency balance for address
   * @param account - the address of the user, wrapped in class Address
   */
  abstract balanceOf(account: Address): Promise<BigNumber>;

  /**
   * Returns currency balance for address
   * @param owner - address of currency owner, wrapped in class Address
   * @param spender - address of spender, wrapped in class Address
   * @returns accordingly for for token, but if currency is native, returns MaxUint256
   */
  abstract allowance(owner: Address, spender: Address): Promise<BigNumber>;
}
