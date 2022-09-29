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
  BorrowingVault as BorrowingVaultContract,
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
import { IMulticallProvider, initSyncMulticallProvider } from '@hovoh/ethcall';
import { BorrowingVaultMulticall } from '../types/contracts/src/vaults/borrowing/BorrowingVault';

export class BorrowingVault {
  /**
   * Instance of ethers Contract class, already initialized with
   * address and rpc provider. It can be used to directly call the
   * methods available on the smart contract.
   *
   * @example
   * ```
   * await vault.balanceOf(address);
   * ```
   * Use with caution, espesially for writes.
   * @readonly
   */
  readonly contract: BorrowingVaultContract;

  /**
   * The RPC provider for the specific chain
   * @readonly
   */
  readonly rpcProvider: JsonRpcProvider;

  /**
   * The chain ID on which this vault resides
   */
  readonly chainId: ChainId;

  /**
   * The address of the vault contract, wrapped in {Address}
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
   * @note A factor refers to a fixed-digit decimal number. Specifically,
   * a decimal number scaled by 1e18. These numbers should be treated as real
   * numbers scaled down by 1e18. For example, the number 50% would be
   * represented as 5*1e17.
   */
  maxLtv?: BigNumber;

  /**
   * A factor that defines the Loan-To-Value at which a user can be liquidated.
   *
   * @note A factor refers to a fixed-digit decimal number. Specifically,
   * a decimal number scaled by 1e18. These numbers should be treated as real
   * numbers scaled down by 1e18. For example, the number 50% would be
   * represented as 5*1e17.
   */
  liqRatio?: BigNumber;

  /**
   * Map of user address and their nonce for this vault.
   *
   * @note Caching "nonce" is needed when composing compound operations.
   * A compound operation is one that needs more then one signiture
   * in the same tx.
   */
  private _cache: Map<Address, BigNumber> = new Map<Address, BigNumber>();

  /**
   * Domain separator needed when signing a tx
   */
  private _domainSeparator: string = '';

  /**
   * Extended instances of provider and contract used when there is a
   * possibility to perform a multicall read on the smart contract.
   * @note A multicall read refers to a batch read done in a single call.
   */
  private _multicall: {
    rpcProvider: IMulticallProvider;
    contract: BorrowingVaultMulticall;
  };

  constructor(address: Address, collateral: Token, debt: Token) {
    invariant(debt.chainId === collateral.chainId, 'Chain mismatch!');

    this.address = address;
    this.collateral = collateral;
    this.chainId = collateral.chainId;
    this.debt = debt;

    this.rpcProvider = RPC_PROVIDER[this.chainId];
    this.contract = BorrowingVault__factory.connect(
      this.address.value,
      this.rpcProvider
    );
    this._multicall = {
      rpcProvider: initSyncMulticallProvider(this.rpcProvider, this.chainId),
      contract: BorrowingVault__factory.multicall(this.address.value),
    };
  }

  /**
   * Static method to check for PERMIT_BORROW or PERMIT_WITHDRAW
   * in array of actions like [DEPOSIT, PERMIT_BORROW, BORROW]
   * or nested array of actions like
   * [X-CALL, FLASHLOAN, [PAYBACK, PERMIT_WITHDRAW, WITHDRAW, SWAP]]
   * @param params - array or nested array of actions
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
   * @param account - user address, wrapped in {Address}
   */
  async preLoad(account: Address) {
    const [
      maxLtv,
      liqRatio,
      nonce,
      domainSeparator,
    ] = await this._multicall.rpcProvider.all([
      this._multicall.contract.maxLtv(),
      this._multicall.contract.liqRatio(),
      this._multicall.contract.nonces(account.value),
      this._multicall.contract.DOMAIN_SEPARATOR(),
    ]);

    this.maxLtv = maxLtv;
    this.liqRatio = liqRatio;

    this._cache.set(account, nonce);
    this._domainSeparator = domainSeparator;
  }

  /**
   * Retruns the borrow interest rate by querying the activeProvider.
   */
  async getBorrowRate(): Promise<BigNumber> {
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
   */
  async getProviders(): Promise<LendingProviderDetails[]> {
    // TODO: move this to preLoad and load them only if they are not init
    const allProvidersAddrs: string[] = await this.contract.getProviders();
    const activeProviderAddr: string = await this.contract.activeProvider();

    const depositCalls = allProvidersAddrs.map(addr =>
      ILendingProvider__factory.multicall(addr).getDepositRateFor(
        this.debt.address.value
      )
    );
    const borrowCalls = allProvidersAddrs.map(addr =>
      ILendingProvider__factory.multicall(addr).getBorrowRateFor(
        this.debt.address.value
      )
    );

    // do a common call for both types and use an index to split them below
    const rates: BigNumber[] = await this._multicall.rpcProvider.all([
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
   * Returns deposit and borrow balance for an account.
   * @param account - user address, wrapped in {Address}
   */
  async getBalances(
    account: Address
  ): Promise<{ deposit: BigNumber; borrow: BigNumber }> {
    const [deposit, borrow] = await this._multicall.rpcProvider.all([
      this._multicall.contract.balanceOf(account.value),
      this._multicall.contract.balanceOfDebt(account.value),
    ]);

    return { deposit, borrow };
  }

  /**
   * Prepares and returns the bundle of actions that will be send to the router
   * for a compound operation of deposit+borrow.
   *
   * @note The array that is returned should be first passed to "BorrowingVault.needSignature".
   * If one of the actions must be signed by the user, we have to obtain the digest
   * from "this.signPermitFor" and make the user sign it with their wallet. The last step is
   * to obtain the txData and the address of the router from "this.getTxData" which is to be
   * used in ethers.sendTransaction.
   *
   * @param amountIn - amount of provided collateral
   * @param amountOut - amount of loan
   * @param srcChainId - chain ID from which the tx is initated
   * @param account - user address, wrapped in {Address}
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
   * Returns the digest to be signed by user's injected rpcProvider/wallet.
   *
   * @note After the user signs, the next step is to obtain the txData and
   * the address of the router from "this.getTxData" which is on its turn is
   * to be used in ethers.sendTransaction.
   *
   * @param params - the permit action that needs to be signed
   */
  async signPermitFor(params: PermitParams): Promise<string> {
    const { owner } = params;

    // if nonce for this user or domainSeparator aren't loaded yet
    if (!this._cache.get(owner) || this._domainSeparator === '') {
      await this.preLoad(owner);
    }
    const nonce: BigNumber = this._cache.get(owner) as BigNumber;

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
    this._cache.set(owner, nonce.add(BigNumber.from(1)));

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
