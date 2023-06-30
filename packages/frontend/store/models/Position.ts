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

export type LendingPosition = {
  vault?: AbstractVault;
  collateral: AssetMeta;

  activeProvider?: LendingProviderWithFinancials;
  activeProvidersNames: string[];
};

export type BorrowingPosition = LendingPosition & {
  debt: AssetMeta;

  ltv: number;
  ltvMax: number;
  ltvThreshold: number;

  liquidationPrice: number;
  liquidationDiff: number;
};

export type Position = BorrowingPosition | LendingPosition;

export const newPosition = (
  type: VaultType
): BorrowingPosition | LendingPosition => {
  return type === VaultType.BORROW
    ? ({} as BorrowingPosition)
    : ({} as LendingPosition);
};
