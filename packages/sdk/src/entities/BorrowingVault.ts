import { Token } from './Token';
import { BigNumber } from '@ethersproject/bignumber';
import { ChainId, RouterAction } from '../enums';
import {
  CONNEXT_ADDRESS,
  CONNEXT_EXECUTOR_ADDRESS,
} from '../constants/addresses';
import { RPC_PROVIDER } from '../constants/rpcs';
import { Address } from './Address';
import {
  BorrowingVault__factory,
  ILendingProvider__factory,
} from '../types/contracts';
import {
  BorrowParams,
  DepositParams,
  PermitParams,
  RouterActionParams,
  LendingProviderDetails,
} from '../types';
import invariant from 'tiny-invariant';
import { JsonRpcProvider } from '@ethersproject/providers';
import { getPermitDigest } from '../functions';

export class BorrowingVault {
  readonly rpcProvider: JsonRpcProvider;

  readonly chainId: ChainId;
  readonly address: Address;

  readonly collateral: Token;
  readonly debt: Token;

  // Storing nonce for this vault per account.
  // Caching "nonce" is needed when composing compound operations.
  // A compound operation is one that needs more then one signiture
  // in the same tx.
  private _cache: { [account: string]: BigNumber } = {};
  private _domainSeparator: string = '';

  constructor(address: Address, collateral: Token, debt: Token) {
    invariant(debt.chainId === collateral.chainId, 'Chain mismatch!');

    this.address = address;
    this.collateral = collateral;
    this.chainId = collateral.chainId;
    this.debt = debt;
    this.rpcProvider = RPC_PROVIDER[this.chainId];
  }

  /**
   * Static method to check for PERMIT_BORROW or PERMIT_WITHDRAW
   * in array of actions like [DEPOSIT, PERMIT_BORROW, BORROW]
   * or nested array of actions like
   * [X-CALL, FLASHLOAN, [PAYBACK, PERMIT_WITHDRAW, WITHDRAW, SWAP]]
   */
  static needSignature(
    params: (RouterActionParams | RouterActionParams[])[]
  ): boolean {
    // TODO: do we need to check presence of r,v,s in PERMITs?

    return !!params.find(p => {
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
   * Loads and sets domainSeparator and account's nonce
   * that will be used when signing operations.
   */
  async preLoad(account: Address) {
    const [nonce, domainSeparator] = await Promise.all([
      BorrowingVault__factory.connect(
        this.address.value,
        this.rpcProvider
      ).nonces(account.value),
      BorrowingVault__factory.connect(
        this.address.value,
        this.rpcProvider
      ).DOMAIN_SEPARATOR(),
    ]);

    this._cache[account.value] = nonce;
    this._domainSeparator = domainSeparator;
  }

  /**
   * Retruns the borrow interest rate by querying the activeProvider.
   */
  async getBorrowRate(): Promise<BigNumber> {
    const activeProvider: string = await BorrowingVault__factory.connect(
      this.address.value,
      this.rpcProvider
    ).activeProvider();
    const borrowRate: BigNumber = await ILendingProvider__factory.connect(
      activeProvider,
      this.rpcProvider
    ).getBorrowRateFor(this.debt.address.value);

    return borrowRate;
  }

  /**
   * Retruns the list with all providers of the vault, marking the active one.
   * Each element also includes the borrow and deposit rate.
   */
  async getProviders(): Promise<LendingProviderDetails[]> {
    const allProvidersAddrs: string[] = await BorrowingVault__factory.connect(
      this.address.value,
      this.rpcProvider
    ).getProviders();

    const borrowPromises = allProvidersAddrs.map(addr =>
      ILendingProvider__factory.connect(
        addr,
        this.rpcProvider
      ).getBorrowRateFor(this.debt.address.value)
    );
    const borrowRates: BigNumber[] = await Promise.all(borrowPromises);

    const depositPromises = allProvidersAddrs.map(addr =>
      ILendingProvider__factory.connect(
        addr,
        this.rpcProvider
      ).getBorrowRateFor(this.debt.address.value)
    );
    const depositRates: BigNumber[] = await Promise.all(depositPromises);

    const activeProviderAddr: string = await BorrowingVault__factory.connect(
      this.address.value,
      this.rpcProvider
    ).activeProvider();

    return allProvidersAddrs.map((addr: string, i: number) => ({
      name: `Provider ${i}`,
      borrowRate: borrowRates[i],
      depositRate: depositRates[i],
      active: addr === activeProviderAddr,
    }));
  }

  /**
   * Returns deposit and borrow balance for an account.
   */
  async getBalances(
    account: Address
  ): Promise<{ deposit: BigNumber; borrow: BigNumber }> {
    const [deposit, borrow] = await Promise.all([
      BorrowingVault__factory.connect(
        this.address.value,
        this.rpcProvider
      ).balanceOf(account.value),
      BorrowingVault__factory.connect(
        this.address.value,
        this.rpcProvider
      ).balanceOfDebt(account.value),
    ]);

    return { deposit, borrow };
  }

  /**
   * Prepares and returns the bundle of actions that will be send to the router
   * for a compound operation of deposit+borrow.
   * The array that is returned should be first passed to "BorrowingVault.needSignature",
   * If one of the actions must be signed by the user, we have to obtain the digest
   * from "this.signPermitFor" and make the user sign it with their wallet.
   * The last step is to obtain the txData and the address of the router from "this.getTxData"
   * which is to be used in ethers.sendTransaction.
   */
  previewDepositAndBorrow(
    amountIn: BigNumber,
    amountOut: BigNumber,
    srcChainId: ChainId,
    account: Address
  ): RouterActionParams[] {
    // TODO estimate bridge cost
    const connextRouter: Address = CONNEXT_ADDRESS[this.chainId];
    if (srcChainId === this.chainId) {
      return [
        this._previewDeposit(amountIn, account, account),
        this._previewPermitBorrow(amountOut, connextRouter, account),
        this._previewBorrow(amountOut, account),
      ];
    }

    const connextExecutor: Address = CONNEXT_EXECUTOR_ADDRESS[this.chainId];
    return [
      this._previewDeposit(amountIn, connextExecutor, account),
      this._previewPermitBorrow(amountOut, connextRouter, account),
      this._previewBorrow(amountOut, account),
    ];
  }

  /**
   * Returns the digest to be signed by user's injected proivder/wallet.
   * After the user signs, the next step is to obtain the txData and
   * the address of the router from "this.getTxData" which is on its turn is
   * to be used in ethers.sendTransaction.
   */
  async signPermitFor(params: PermitParams): Promise<string> {
    const { owner } = params;

    // if nonce for this user or domainSeparator aren't loaded yet
    if (!this._cache[owner.value] || this._domainSeparator === '') {
      await this.preLoad(owner);
    }
    const nonce = this._cache[owner.value];

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
    this._cache[owner.value] = nonce.add(BigNumber.from(1));

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
