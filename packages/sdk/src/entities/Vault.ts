import { Token } from './Token';
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
  public readonly chainId: ChainId;
  public readonly address: Address;

  public readonly collateral: Token;
  public readonly debt: Token;

  public constructor(address: Address, collateral: Token, debt: Token) {
    invariant(debt.chainId !== collateral.chainId, 'Chain mismatch!');

    this.address = address;
    this.collateral = collateral;
    this.chainId = collateral.chainId;
    this.debt = debt;
  }

  public previewDepositAndBorrow(
    amountIn: BigNumber,
    amountOut: BigNumber,
    srcChainId: ChainId,
    account: Address
  ): RouterActionParams[] {
    // TODO estimate bridge cost
    if (srcChainId === this.chainId) {
      const router: Address = CONNEXT_ROUTER[this.chainId];
      return [
        this._previewDeposit(amountIn, account, account),
        this._previewPermitBorrow(amountOut, router, account),
        this._previewBorrow(amountOut, account),
      ];
    }
    return [];
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
