import { Token } from './Token';
import { SDK } from '../SDK';
import { BigNumber } from '@ethersproject/bignumber';
import { ChainId, RouterAction } from '../enums';
import { CONNEXT_ROUTER } from '../constants/connextRouters';
import { Address } from './Address';
import {
  BorrowParams,
  DepositParams,
  PermitParams,
  RouterActionParams,
} from '../types';
import invariant from 'tiny-invariant';

export class Vault {
  public readonly sdk: SDK;

  public readonly chainId: ChainId;
  public readonly address: Address;

  public readonly collateral: Token;
  public readonly debt: Token;

  public constructor(
    sdk: SDK,
    address: Address,
    collateral: Token,
    debt: Token
  ) {
    invariant(debt.chainId != collateral.chainId, 'Chain mismatch!');

    this.sdk = sdk;
    this.address = address;
    this.collateral = collateral;
    this.chainId = collateral.chainId;
    this.debt = debt;
  }

  public previewDepositAndBorrow(
    amountIn: BigNumber,
    amountOut: BigNumber,
    srcChainId: ChainId
  ): RouterActionParams[] {
    // TODO estimate bridge cost
    if (srcChainId == this.chainId) {
      const router: Address = CONNEXT_ROUTER[this.chainId];
      return [
        this._previewDeposit(amountIn, this.sdk.account),
        this._previewPermitBorrow(amountOut, router),
        this._previewBorrow(amountOut),
      ];
    }
    return [];
  }

  private _previewDeposit(amount: BigNumber, sender: Address): DepositParams {
    return {
      action: RouterAction.DEPOSIT,
      vault: this.address,
      amount,
      receiver: this.sdk.account,
      sender,
    };
  }

  private _previewBorrow(amount: BigNumber): BorrowParams {
    return {
      action: RouterAction.BORROW,
      vault: this.address,
      amount,
      receiver: this.sdk.account,
      owner: this.sdk.account,
    };
  }

  private _previewPermitBorrow(
    amount: BigNumber,
    spender: Address
  ): PermitParams {
    return {
      action: RouterAction.PERMIT_BORROW,
      vault: this.address,
      amount,
      spender,
      owner: this.sdk.account,
    };
  }
}
