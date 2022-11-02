import { BigNumber } from '@ethersproject/bignumber';

import { Address } from '../entities';
import { RouterAction } from '../enums';

export type BaseRouterActionParams = {
  action: RouterAction;
  amount: BigNumber;
};

export type DepositParams = BaseRouterActionParams & {
  action: RouterAction.DEPOSIT;
  vault: Address;
  sender: Address;
  receiver: Address;
};

export type BorrowParams = BaseRouterActionParams & {
  action: RouterAction.BORROW;
  vault: Address;
  owner: Address;
  receiver: Address;
};

export type PaybackParams = BaseRouterActionParams & {
  action: RouterAction.PAYBACK;
  vault: Address;
  sender: Address;
  receiver: Address;
};

export type WithdrawParams = BaseRouterActionParams & {
  action: RouterAction.WITHDRAW;
  vault: Address;
  owner: Address;
  receiver: Address;
};

export type PermitParams = BaseRouterActionParams & {
  action: RouterAction.PERMIT_BORROW | RouterAction.PERMIT_WITHDRAW;
  vault: Address;
  owner: Address;
  spender: Address;
  deadline?: number;
  v?: number;
  r?: string;
  s?: string;
};

//(uint256 destDomain, address asset, uint256 amount, address receiver) =
export type XTransferParams = BaseRouterActionParams & {
  destDomain: number;
  asset: Address;
  receiver: Address;
};

export type RouterActionParams =
  | DepositParams
  | BorrowParams
  | PaybackParams
  | WithdrawParams
  | PermitParams
  | XTransferParams;
