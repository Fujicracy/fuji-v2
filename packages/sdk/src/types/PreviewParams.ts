import { BigNumber } from '@ethersproject/bignumber';

import { AbstractVault } from '../entities';
import { Address } from '../entities/Address';
import { Currency } from '../entities/Currency';
import { PreviewName } from '../enums';
import { ChainId } from '../enums/ChainId';

export type BasePreviewParams = {
  name: PreviewName;
  vault: AbstractVault;
  account: Address;
  srcChainId: ChainId;
  slippage?: number;
};

export type DepositPreviewParams = BasePreviewParams & {
  name: PreviewName.DEPOSIT;
  amountIn: BigNumber;
  tokenIn: Currency;
};

export type BorrowPreviewParams = BasePreviewParams & {
  name: PreviewName.BORROW;
  amountOut: BigNumber;
  tokenOut: Currency;
  deadline?: number;
};

export type PaybackPreviewParams = BasePreviewParams & {
  name: PreviewName.PAYBACK;
  amountIn: BigNumber;
  tokenIn: Currency;
};

export type WithdrawPreviewParams = BasePreviewParams & {
  name: PreviewName.WITHDRAW;
  amountOut: BigNumber;
  tokenOut: Currency;
  deadline?: number;
};

export type DepositAndBorrowPreviewParams = BasePreviewParams & {
  name: PreviewName.DEPOSIT_AND_BORROW;
  amountIn: BigNumber;
  tokenIn: Currency;
  amountOut: BigNumber;
  tokenOut: Currency;
  deadline?: number;
};

export type PaybackAndWithdrawPreviewParams = BasePreviewParams & {
  name: PreviewName.PAYBACK_AND_WITHDRAW;
  amountIn: BigNumber;
  tokenIn: Currency;
  amountOut: BigNumber;
  tokenOut: Currency;
  deadline?: number;
};

export type PreviewParams =
  | DepositPreviewParams
  | BorrowPreviewParams
  | PaybackPreviewParams
  | WithdrawPreviewParams
  | DepositAndBorrowPreviewParams
  | PaybackAndWithdrawPreviewParams;
