import { Token } from './Token';
import { BigNumber } from '@ethersproject/bignumber';
import { ChainId, RouterAction } from '../enums';
import {
  CONNEXT_ADDRESS,
  CONNEXT_EXECUTOR_ADDRESS,
  LIB_SIG_UTILS_ADDRESS,
} from '../constants/addresses';
import { RPC_PROVIDER } from '../constants/rpcs';
import { Address } from './Address';
import {
  BorrowingVault__factory,
  LibSigUtils__factory,
} from '../types/contracts';
import {
  BorrowParams,
  DepositParams,
  PermitParams,
  RouterActionParams,
} from '../types';
import invariant from 'tiny-invariant';
import { JsonRpcProvider } from '@ethersproject/providers';

export type AccountDetails = {
  depositBalance: BigNumber;
  debtBalance: BigNumber;
  nonce: BigNumber;
};

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

  // should be called only once?
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
   */
  async signPermitFor(params: PermitParams): Promise<string> {
    const { owner, spender, amount } = params;

    // if nonce for this user isn't loaded yet
    if (!this._cache[owner.value]) {
      await this.preLoad(owner);
    }
    const nonce = this._cache[owner.value];

    let structHash: string;
    const libAddr: Address = LIB_SIG_UTILS_ADDRESS[this.chainId];

    // TODO: do we need to query this for getting current timestamp?
    const block = await this.rpcProvider.getBlock('latest');
    // deadline is 24h
    const deadline: number = block.timestamp + 24 * 60 * 60;

    if (params.action === RouterAction.PERMIT_BORROW) {
      structHash = await LibSigUtils__factory.connect(
        libAddr.value,
        this.rpcProvider
      ).getStructHashBorrow({
        owner: owner.value,
        spender: spender.value,
        amount,
        nonce,
        deadline,
      });
    } else {
      structHash = await LibSigUtils__factory.connect(
        libAddr.value,
        this.rpcProvider
      ).getStructHashAsset({
        owner: owner.value,
        spender: spender.value,
        amount,
        nonce,
        deadline,
      });
    }

    // update _cache if user has to sign another operation from the same tx
    this._cache[owner.value] = nonce.add(BigNumber.from(1));

    return await LibSigUtils__factory.connect(
      libAddr.value,
      this.rpcProvider
    ).getHashTypedDataV4Digest(this._domainSeparator, structHash);
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
