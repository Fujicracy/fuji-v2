import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider, WebSocketProvider } from '@ethersproject/providers';
import { IMulticallProvider } from '@hovoh/ethcall';
import { Observable } from 'rxjs';
import invariant from 'tiny-invariant';

import { CONNEXT_ROUTER_ADDRESS } from '../constants/addresses';
import { ChainId, RouterAction } from '../enums';
import { getPermitDigest } from '../functions';
import {
  BorrowParams,
  ChainConfig,
  DepositParams,
  LendingProviderDetails,
  PermitParams,
  RouterActionParams,
} from '../types';
import {
  BorrowingVault as BorrowingVaultContract,
  BorrowingVault__factory,
  ILendingProvider__factory,
} from '../types/contracts';
import { BorrowingVaultMulticall } from '../types/contracts/src/vaults/borrowing/BorrowingVault';
import { Address } from './Address';
import { ChainConnection } from './ChainConnection';
import { StreamManager } from './StreamManager';
import { Token } from './Token';

type AccountBalances = {
  deposit: BigNumber;
  borrow: BigNumber;
};

/**
 * The BorrowingVault class encapsulates the end-user logic of interation with the
 * BorrowingVault cotract without the need to deal directly with ethers.js (ABIs, providers etc).
 *
 * It contains read-only functions and leaves to the client only the final step of a blockchain write.
 * The class aims to expose functions that together with user's inputs go throughout the most common
 * path of interacting with a BorrowingVault contract.
 */

export class BorrowingVault extends StreamManager {
  /**
   * The chain ID on which this vault resides
   */
  readonly chainId: ChainId;

  /**
   * The address of the vault contract, wrapped in {@link Address}
   * @readonly
   */
  readonly address: Address;

  /**
   * Represents the token, accepted by the vault as collateral that
   * can be pledged to take out a loan
   * @readonly
   */
  readonly collateral: Token;

  /**
   * Represents the token, in which a loan can be taken out
   * @readonly
   */
  readonly debt: Token;

  /**
   * A factor that defines the maximum Loan-To-Value a user can take.
   *
   * @remarks
   * A factor refers to a fixed-digit decimal number. Specifically,
   * a decimal number scaled by 1e18. These numbers should be treated as real
   * numbers scaled down by 1e18. For example, the number 50% would be
   * represented as 5*1e17.
   */
  maxLtv?: BigNumber;

  /**
   * A factor that defines the Loan-To-Value at which a user can be liquidated.
   *
   * @remarks
   * A factor refers to a fixed-digit decimal number. Specifically,
   * a decimal number scaled by 1e18. These numbers should be treated as real
   * numbers scaled down by 1e18. For example, the number 50% would be
   * represented as 5*1e17.
   */
  liqRatio?: BigNumber;

  /**
   * Instance of ethers Contract class, already initialized with
   * address and rpc provider. It can be used to directly call the
   * methods available on the smart contract.
   *
   * @example
   * ```ts
   * await vault.balanceOf(address);
   * ```
   * Use with caution, espesially for writes.
   */
  contract?: BorrowingVaultContract;

  /**
   * Extended instance of contract used when there is a
   * possibility to perform a multicall read on the smart contract.
   * @remarks
   * A multicall read refers to a batch read done in a single call.
   */
  multicallContract?: BorrowingVaultMulticall;

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
   * Map of user address and their nonce for this vault.
   *
   * @remarks
   * Caching "nonce" is needed when composing compound operations.
   * A compound operation is one that needs more then one signiture
   * in the same tx.
   */
  private _cache: Map<string, BigNumber>;

  /**
   * Domain separator needed when signing a tx
   */
  private _domainSeparator: string;

  constructor(address: Address, collateral: Token, debt: Token) {
    invariant(debt.chainId === collateral.chainId, 'Chain mismatch!');

    super();

    this.address = address;
    this.collateral = collateral;
    this.chainId = collateral.chainId;
    this.debt = debt;

    this._cache = new Map<string, BigNumber>();
    this._domainSeparator = '';
  }

  /**
   * Static method to check for PERMIT_BORROW or PERMIT_WITHDRAW
   * in array of actions like [DEPOSIT, PERMIT_BORROW, BORROW]
   * or nested array of actions like
   * [X-CALL, FLASHLOAN, [PAYBACK, PERMIT_WITHDRAW, WITHDRAW, SWAP]]
   *
   * @param params - array or nested array of actions
   */
  static needSignature(
    params: (RouterActionParams | RouterActionParams[])[]
  ): boolean {
    // TODO: do we need to check presence of r,v,s in PERMITs?

    return !!params.find((p) => {
      if (p instanceof Array) {
        return BorrowingVault.needSignature(p);
      }
      return (
        p.action === RouterAction.PERMIT_BORROW ||
        p.action === RouterAction.PERMIT_WITHDRAW
      );
    });
  }

  /**
   * Creates a connection by setting an rpc provider.
   *
   * @param configParams - {@link ChainConfig} object with infura and alchemy ids
   */
  setConnection(configParams: ChainConfig): BorrowingVault {
    const connection = ChainConnection.from(configParams, this.chainId);
    this.rpcProvider = connection.rpcProvider;
    this.wssProvider = connection.wssProvider;
    this.multicallRpcProvider = connection.multicallRpcProvider;

    this.contract = BorrowingVault__factory.connect(
      this.address.value,
      this.rpcProvider
    );
    this.multicallContract = BorrowingVault__factory.multicall(
      this.address.value
    );

    return this;
  }

  /**
   * Loads and sets domainSeparator and account's nonce
   * that will be used when signing operations.
   *
   * @param account - user address, wrapped in {@link Address}
   * @throws if {@link setConnection} was not called beforehand
   */
  async preLoad(account: Address) {
    invariant(
      this.multicallContract && this.multicallRpcProvider,
      'Connection not set!'
    );
    const [maxLtv, liqRatio, nonce, domainSeparator] =
      await this.multicallRpcProvider.all([
        this.multicallContract.maxLtv(),
        this.multicallContract.liqRatio(),
        this.multicallContract.nonces(account.value),
        this.multicallContract.DOMAIN_SEPARATOR(),
      ]);

    this.maxLtv = maxLtv;
    this.liqRatio = liqRatio;

    this._cache.set(account.value, nonce);
    this._domainSeparator = domainSeparator;
  }

  /**
   * Retruns the borrow interest rate by querying the activeProvider.
   *
   * @throws if {@link setConnection} was not called beforehand
   */
  async getBorrowRate(): Promise<BigNumber> {
    invariant(this.contract && this.rpcProvider, 'Connection not set!');

    const activeProvider: string = await this.contract.activeProvider();
    const borrowRate: BigNumber = await ILendingProvider__factory.connect(
      activeProvider,
      this.rpcProvider
    ).getBorrowRateFor(this.debt.address.value);

    return borrowRate;
  }

  /**
   * Retruns the list with all providers of the vault, marking the active one.
   * Each element also includes the borrow and deposit rate.
   *
   * @throws if {@link setConnection} was not called beforehand
   */
  async getProviders(): Promise<LendingProviderDetails[]> {
    invariant(
      this.contract && this.multicallRpcProvider,
      'Connection not set?'
    );
    // TODO: move this to preLoad and load them only if they are not init
    const allProvidersAddrs: string[] = await this.contract.getProviders();
    const activeProviderAddr: string = await this.contract.activeProvider();

    const depositCalls = allProvidersAddrs.map((addr) =>
      ILendingProvider__factory.multicall(addr).getDepositRateFor(
        this.debt.address.value
      )
    );
    const borrowCalls = allProvidersAddrs.map((addr) =>
      ILendingProvider__factory.multicall(addr).getBorrowRateFor(
        this.debt.address.value
      )
    );

    // do a common call for both types and use an index to split them below
    const rates: BigNumber[] = await this.multicallRpcProvider.all([
      ...depositCalls,
      ...borrowCalls,
    ]);

    const splitIndex = rates.length / 2;
    return allProvidersAddrs.map((addr: string, i: number) => ({
      name: `Provider ${i}`,
      depositRate: rates[i],
      borrowRate: rates[i + splitIndex],
      active: addr === activeProviderAddr,
    }));
  }

  /**
   * Returns deposit and borrow balances for an account.
   *
   * @param account - user address, wrapped in {@link Address}
   * @throws if {@link setConnection} was not called beforehand
   */
  async getBalances(account: Address): Promise<AccountBalances> {
    invariant(
      this.multicallContract && this.multicallRpcProvider,
      'Connection not set!'
    );
    const [deposit, borrow] = await this.multicallRpcProvider.all([
      this.multicallContract.balanceOf(account.value),
      this.multicallContract.balanceOfDebt(account.value),
    ]);

    return { deposit, borrow };
  }

  /**
   * Returns a stream of deposit and borrow balances for an account.
   *
   * @param account - user address, wrapped in {@link Address}
   * @throws if {@link setConnection} was not called beforehand
   */
  getBalancesStream(account: Address): Observable<AccountBalances> {
    invariant(this.contract && this.wssProvider, 'Connection not set!');
    const filters = [
      this.contract.filters.Deposit(null, account.value),
      this.contract.filters.Payback(null, account.value),
      this.contract.filters.Borrow(null, null, account.value),
      this.contract.filters.Withdraw(null, null, account.value),
    ];

    return this.streamFrom<Address, AccountBalances>(
      this.wssProvider,
      this.getBalances,
      [account],
      account,
      filters
    );
  }

  /**
   * Prepares and returns the bundle of actions that will be send to the router
   * for a compound operation of deposit+borrow.
   *
   * @remarks
   * The array that is returned should be first passed to `BorrowingVault.needSignature`.
   * If one of the actions must be signed by the user, we have to obtain the digest
   * from `this.signPermitFor` and make the user sign it with their wallet. The last step is
   * to obtain the txData and the address of the router from `this.getTxData` which is to be
   * used in ethers.sendTransaction.
   *
   * @param amountIn - amount of provided collateral
   * @param amountOut - amount of loan
   * @param srcChainId - chain ID from which the tx is initated
   * @param account - user address, wrapped in {@link Address}
   */
  previewDepositAndBorrow(
    amountIn: BigNumber,
    amountOut: BigNumber,
    srcChainId: ChainId,
    account: Address
  ): RouterActionParams[] {
    // TODO estimate bridge cost
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[this.chainId];
    if (srcChainId === this.chainId) {
      return [
        this._previewDeposit(amountIn, account, account),
        this._previewPermitBorrow(amountOut, connextRouter, account),
        this._previewBorrow(amountOut, account),
      ];
    }

    return [
      this._previewDeposit(amountIn, connextRouter, account),
      this._previewPermitBorrow(amountOut, connextRouter, account),
      this._previewBorrow(amountOut, account),
    ];
  }

  /**
   * Returns the digest to be signed by user's injected rpcProvider/wallet.
   *
   * @remarks
   * After the user signs, the next step is to obtain the txData and
   * the address of the router from "this.getTxData" which is on its turn is
   * to be used in ethers.sendTransaction.
   *
   * @param params - the permit action that needs to be signed
   */
  async signPermitFor(params: PermitParams): Promise<string> {
    const { owner } = params;

    // if nonce for this user or domainSeparator aren't loaded yet
    if (!this._cache.get(owner.value) || this._domainSeparator === '') {
      await this.preLoad(owner);
    }
    const nonce: BigNumber = this._cache.get(owner.value) as BigNumber;

    // if deadline is not given, then set it to approx. 24h
    const deadline: number =
      params.deadline ?? Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    const digest: string = getPermitDigest(
      params,
      nonce,
      deadline,
      this._domainSeparator
    );

    // update _cache if user has to sign another operation in the same tx
    // For ex. when shifting a position from one vault to another,
    // user has to sign first WITHDRAW and then BORROW
    this._cache.set(owner.value, nonce.add(BigNumber.from(1)));

    return digest;
  }

  private _previewDeposit(
    amount: BigNumber,
    sender: Address,
    account: Address
  ): DepositParams {
    return {
      action: RouterAction.DEPOSIT,
      vault: this.address,
      amount,
      receiver: account,
      sender,
    };
  }

  private _previewBorrow(amount: BigNumber, account: Address): BorrowParams {
    return {
      action: RouterAction.BORROW,
      vault: this.address,
      amount,
      receiver: account,
      owner: account,
    };
  }

  private _previewPermitBorrow(
    amount: BigNumber,
    spender: Address,
    account: Address
  ): PermitParams {
    return {
      action: RouterAction.PERMIT_BORROW,
      vault: this.address,
      amount,
      spender,
      owner: account,
    };
  }
}
