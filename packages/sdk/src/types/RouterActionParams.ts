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
  receiver: Address;
  deadline?: number;
  v?: number;
  r?: string;
  s?: string;
};

//(uint256 destDomain, uint256 slippage, address asset, uint256 amount, address receiver, address sender)
export type XTransferParams = BaseRouterActionParams & {
  action: RouterAction.X_TRANSFER;
  destDomain: number;
  asset: Address;
  receiver: Address;
  slippage: number;
  sender: Address;
};

//(uint256 destDomain, uint256 slippage, address asset, uint256 amount, bytes memory callData)
export type XTransferWithCallParams = BaseRouterActionParams & {
  action: RouterAction.X_TRANSFER_WITH_CALL;
  destDomain: number;
  asset: Address;
  slippage: number;
  innerActions: RouterActionParams[];
};

export type WrapNativeParams = BaseRouterActionParams & {
  action: RouterAction.DEPOSIT_ETH;
};

export type UnwrapNativeParams = BaseRouterActionParams & {
  action: RouterAction.WITHDRAW_ETH;
  receiver: Address;
};

export type RouterActionParams =
  | DepositParams
  | BorrowParams
  | PaybackParams
  | WithdrawParams
  | PermitParams
  | XTransferParams
  | XTransferWithCallParams
  | WrapNativeParams
  | UnwrapNativeParams;
