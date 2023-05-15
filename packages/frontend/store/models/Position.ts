import { BorrowingVault, Currency, LendingProviderDetails } from '@x-fuji/sdk';

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
export type Position = {
  vault?: BorrowingVault /*| LendingVault // Contain chainId */;

  collateral: AssetMeta;
  debt: AssetMeta;

  ltv: number;
  ltvMax: number;
  ltvThreshold: number;

  liquidationPrice: number;
  liquidationDiff: number;

  activeProvider?: LendingProviderDetails;
  activeProvidersNames: string[];
  providers?: LendingProviderDetails[];
};
