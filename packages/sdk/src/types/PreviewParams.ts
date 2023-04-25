import { BigNumber } from '@ethersproject/bignumber';

import { Address } from '../entities/Address';
import { BorrowingVault } from '../entities/BorrowingVault';
import { Token } from '../entities/Token';
import { PreviewName } from '../enums';
import { ChainId } from '../enums/ChainId';

export type BasePreviewParams = {
  name: PreviewName;
  vault: BorrowingVault;
  account: Address;
  srcChainId: ChainId;
  slippage?: number;
};

export type DepositPreviewParams = BasePreviewParams & {
  name: PreviewName.DEPOSIT;
  amountIn: BigNumber;
  tokenIn: Token;
};

export type BorrowPreviewParams = BasePreviewParams & {
  name: PreviewName.BORROW;
  amountOut: BigNumber;
  tokenOut: Token;
  deadline?: number;
};

export type PaybackPreviewParams = BasePreviewParams & {
  name: PreviewName.PAYBACK;
  amountIn: BigNumber;
  tokenIn: Token;
};

export type WithdrawPreviewParams = BasePreviewParams & {
  name: PreviewName.WITHDRAW;
  amountOut: BigNumber;
  tokenOut: Token;
  deadline?: number;
};

export type DepositAndBorrowPreviewParams = BasePreviewParams & {
  name: PreviewName.DEPOSIT_AND_BORROW;
  amountIn: BigNumber;
  tokenIn: Token;
  amountOut: BigNumber;
  tokenOut: Token;
  deadline?: number;
};

export type PaybackAndWithdrawPreviewParams = BasePreviewParams & {
  name: PreviewName.PAYBACK_AND_WITHDRAW;
  amountIn: BigNumber;
  tokenIn: Token;
  amountOut: BigNumber;
  tokenOut: Token;
  deadline?: number;
};

export type PreviewParams =
  | DepositPreviewParams
  | BorrowPreviewParams
  | PaybackPreviewParams
  | WithdrawPreviewParams
  | DepositAndBorrowPreviewParams
  | PaybackAndWithdrawPreviewParams;
