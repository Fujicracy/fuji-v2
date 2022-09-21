import { BigNumber } from '@ethersproject/bignumber';
import { RouterAction } from '../enums';
import { Address } from '../entities';

export type DepositParams = {
  action: RouterAction.DEPOSIT;
  vault: Address;
  amount: BigNumber;
  receiver: Address;
  sender: Address;
};

export type BorrowParams = {
  action: RouterAction.BORROW;
  vault: Address;
  amount: BigNumber;
  receiver: Address;
  owner: Address;
};

export type PaybackParams = {
  action: RouterAction.PAYBACK;
  vault: Address;
  amount: BigNumber;
  receiver: Address;
  sender: Address;
};

export type WithdrawParams = {
  action: RouterAction.WITHDRAW;
  vault: Address;
  amount: BigNumber;
  receiver: Address;
  owner: Address;
};

export type PermitParams = {
  action: RouterAction.PERMIT_BORROW | RouterAction.PERMIT_WITHDRAW;
  vault: Address;
  amount: BigNumber;
  owner: Address;
  spender: Address;
  deadline?: number;
  v?: number;
  r?: Address;
  s?: Address;
};

export type RouterActionParams =
  | DepositParams
  | BorrowParams
  | PaybackParams
  | WithdrawParams
  | PermitParams;
