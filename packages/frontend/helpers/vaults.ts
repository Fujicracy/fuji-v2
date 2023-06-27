import {
  AbstractVault,
  Address,
  FujiError,
  VaultWithFinancials,
} from '@x-fuji/sdk';

import { DUST_AMOUNT_IN_WEI } from '../constants';
import { sdk } from '../services/sdk';
import { chains } from './chains';

export type FinancialsOrError = VaultWithFinancials | FujiError;

/*
  Convenience function that calls the SDK to get all the vaults with
  financials and returns both the data and errors.
*/
export const getAllBorrowingVaultFinancials = async (
  address?: Address
): Promise<{
  data: FinancialsOrError[];
}> => {
  const data: FinancialsOrError[] = [];

  for (let index = 0; index < chains.length; index++) {
    const chain = chains[index];
    const result = await sdk.getBorrowingVaultsFinancials(
      chain.chainId,
      address
    );
    if (result.success) {
      data.push(...result.data);
    } else {
      data.push(
        new FujiError(result.error.message, result.error.code, {
          chain: chain.name,
        })
      );
    }
  }

  return { data };
};

export const userHasFundsInVault = (
  vault: AbstractVault,
  list: VaultWithFinancials[]
) => {
  const match = list.find((v) => v.vault.address.equals(vault.address));
  return match && match.depositBalance.gt(DUST_AMOUNT_IN_WEI);
};

export const vaultsFromFinancialsOrError = (
  data: FinancialsOrError[]
): VaultWithFinancials[] =>
  data.filter((d) => !(d instanceof FujiError)) as VaultWithFinancials[];
