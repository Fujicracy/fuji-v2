import { Token } from './Token';
import { BigNumber } from '@ethersproject/bignumber';
import { ChainId, RouterAction } from '../enums';
import { CONNEXT_ADDRESS, LIB_SIG_UTILS_ADDRESS, RPC_PROVIDER } from '../constants';
import { Address } from './Address';
import {
  BorrowingVault__factory,
  BorrowParams,
  DepositParams,
  LibSigUtils__factory,
  PermitParams,
  RouterActionParams,
} from '../types';
import invariant from 'tiny-invariant';
import { JsonRpcProvider } from '@ethersproject/providers';

export class Vault {
  public readonly rpcProvider: JsonRpcProvider;

  public readonly chainId: ChainId;
  public readonly address: Address;

  public readonly collateral: Token;
  public readonly debt: Token;

  // _cachedNonce is necessary for compound operations,
  // those that needs more than one signiture in the same tx.
  // It will be added up to the value of nonce returned from the vault.
  private _cachedNonce: BigNumber;

  public constructor(address: Address, collateral: Token, debt: Token) {
    invariant(debt.chainId !== collateral.chainId, 'Chain mismatch!');

    this.address = address;
    this.collateral = collateral;
    this.chainId = collateral.chainId;
    this.debt = debt;
    this.rpcProvider = RPC_PROVIDER[this.chainId];
    this._cachedNonce = BigNumber.from(0);
  }

  public static needSignature(params: RouterActionParams[]): boolean {
    // TODO nested check and presence of r,v,s in PERMITs
    return !!params.find(
      ({ action }) =>
        action === RouterAction.PERMIT_BORROW ||
        action === RouterAction.PERMIT_WITHDRAW
    );
  }

  public previewDepositAndBorrow(
    amountIn: BigNumber,
    amountOut: BigNumber,
    srcChainId: ChainId,
    account: Address
  ): RouterActionParams[] {
    // TODO estimate bridge cost
    if (srcChainId === this.chainId) {
      const router: Address = CONNEXT_ADDRESS[this.chainId];
      return [
        this._previewDeposit(amountIn, account, account),
        this._previewPermitBorrow(amountOut, router, account),
        this._previewBorrow(amountOut, account),
      ];
    }
    return [];
  }

  /**
   * Returns the digest to be signed by user's injected proivder/wallet.
   */
  public async signPermitFor(params: PermitParams): Promise<string> {
    const storedNonce: BigNumber = await BorrowingVault__factory.connect(
      this.address.value,
      this.rpcProvider
    ).nonces(params.owner.value);

    // TODO: how to sync with blockchain?
    const nonce = storedNonce.add(this._cachedNonce);
    this._cachedNonce = this._cachedNonce.add(BigNumber.from(1));

    const domainSeparator: string = await BorrowingVault__factory.connect(
      this.address.value,
      this.rpcProvider
    ).DOMAIN_SEPARATOR();

    let structHash: string;
    const libAddr: Address = LIB_SIG_UTILS_ADDRESS[this.chainId];
    const block = await this.rpcProvider.getBlock('latest');
    const deadline: number = block.timestamp + (24 * 60 * 60);
    if (params.action === RouterAction.PERMIT_BORROW) {
      structHash = await LibSigUtils__factory.connect(
        libAddr.value,
        this.rpcProvider
      ).getStructHashBorrow({
        owner: params.owner.value,
        spender: params.spender.value,
        amount: params.amount,
        nonce,
        // TODO
        deadline,
      });
    } else {
      structHash = await LibSigUtils__factory.connect(
        libAddr.value,
        this.rpcProvider
      ).getStructHashAsset({
        owner: params.owner.value,
        spender: params.spender.value,
        amount: params.amount,
        nonce,
        // TODO
        deadline: 1,
      });
    }

    return await LibSigUtils__factory.connect(
      libAddr.value,
      this.rpcProvider
    ).getHashTypedDataV4Digest(domainSeparator, structHash);
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
