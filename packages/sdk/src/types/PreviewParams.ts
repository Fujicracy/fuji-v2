import { BigNumber } from '@ethersproject/bignumber';

import { AbstractVault, BorrowingVault } from '../entities';
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

export type BorrowingPreviewParams = Omit<BasePreviewParams, 'vault'> & {
  vault: BorrowingVault;
};

export type DepositPreviewParams = BasePreviewParams & {
  name: PreviewName.DEPOSIT;
  amountIn: BigNumber;
  tokenIn: Currency;
};

export type BorrowPreviewParams = BorrowingPreviewParams & {
  name: PreviewName.BORROW;
  amountOut: BigNumber;
  tokenOut: Currency;
  deadline?: number;
};

export type PaybackPreviewParams = BorrowingPreviewParams & {
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

export type DepositAndBorrowPreviewParams = BorrowingPreviewParams & {
  name: PreviewName.DEPOSIT_AND_BORROW;
  amountIn: BigNumber;
  tokenIn: Currency;
  amountOut: BigNumber;
  tokenOut: Currency;
  deadline?: number;
};

export type PaybackAndWithdrawPreviewParams = BorrowingPreviewParams & {
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
