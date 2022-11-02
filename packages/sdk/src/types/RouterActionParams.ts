import { BigNumber } from '@ethersproject/bignumber';

import { Address } from '../entities';
import { RouterAction } from '../enums';

export type BaseRouterActionParams = {
  action: RouterAction;
  vault: Address;
  amount: BigNumber;
};

export type DepositParams = BaseRouterActionParams & {
  action: RouterAction.DEPOSIT;
  sender: Address;
  receiver: Address;
};

export type BorrowParams = BaseRouterActionParams & {
  action: RouterAction.BORROW;
  owner: Address;
  receiver: Address;
};

export type PaybackParams = BaseRouterActionParams & {
  action: RouterAction.PAYBACK;
  sender: Address;
  receiver: Address;
};

export type WithdrawParams = BaseRouterActionParams & {
  action: RouterAction.WITHDRAW;
  owner: Address;
  receiver: Address;
};

export type PermitParams = BaseRouterActionParams & {
  action: RouterAction.PERMIT_BORROW | RouterAction.PERMIT_WITHDRAW;
  owner: Address;
  spender: Address;
  deadline?: number;
  v?: number;
  r?: string;
  s?: string;
};

export type RouterActionParams =
  | DepositParams
  | BorrowParams
  | PaybackParams
  | WithdrawParams
  | PermitParams;
