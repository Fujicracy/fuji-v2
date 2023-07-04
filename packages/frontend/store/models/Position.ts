import {
  AbstractVault,
  Currency,
  LendingProviderWithFinancials,
  VaultType,
} from '@x-fuji/sdk';

/**
 * @remarks
 * Type that represents detail data about an asset (collateral or debt) within a `Position` type.
 */
export type AssetMeta = {
  currency: Currency;
  amount: number;
  usdPrice: number;
  baseAPR?: number;
};

/**
 * @remarks
 * Type representing an open position at a Fuji-V2 vault.
 */

type AbstractPosition = {
  vault?: AbstractVault;
  collateral: AssetMeta;

  activeProvider?: LendingProviderWithFinancials;
  activeProvidersNames: string[];
};

export type BorrowingPosition = AbstractPosition & {
  type: VaultType.BORROW;
  debt: AssetMeta;

  ltv: number;
  ltvMax: number;
  ltvThreshold: number;

  liquidationPrice: number;
  liquidationDiff: number;
};

export type LendingPosition = AbstractPosition & {
  type: VaultType.LEND;
};

export type Position = BorrowingPosition | LendingPosition;

export const newPosition = (
  type: VaultType
): BorrowingPosition | LendingPosition => {
  return type === VaultType.BORROW
    ? ({ type: VaultType.BORROW } as BorrowingPosition)
    : ({ type: VaultType.LEND } as LendingPosition);
};
