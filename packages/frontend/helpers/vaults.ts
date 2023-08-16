import {
  AbstractVault,
  Address,
  FujiError,
  FujiResultPromise,
  FujiResultSuccess,
  GetLLamaFinancialsResponse,
  VaultType,
  VaultWithFinancials,
} from '@x-fuji/sdk';

import { DUST_AMOUNT_IN_WEI } from '../constants';
import { sdk } from '../services/sdk';
import { useBorrow } from '../store/borrow.store';
import { useLend } from '../store/lend.store';
import {
  CACHE_LIMIT,
  getCacheLastUpdatedDate,
  getLlamaCache,
  setLlamaCache,
} from './cache';
import { chains } from './chains';
import { notify } from './notifications';

export type FinancialsOrError = VaultWithFinancials | FujiError;

export const getVaultsWithFinancials = async (
  availableVaults: VaultWithFinancials[]
) => {
  const llamaResult = await getLlamasWithFinancials();

  if (!llamaResult.success) {
    notify({
      type: 'error',
      message: llamaResult.error.message,
    });
  }

  availableVaults =
    llamaResult.success && llamaResult.data
      ? sdk.getLlamasForVaults(availableVaults, llamaResult.data)
      : availableVaults;

  return availableVaults;
};

export const getVaultFinancials = async (
  type: VaultType,
  address?: Address
): Promise<{
  data: FinancialsOrError[];
}> => {
  const data: FinancialsOrError[] = [];

  for (let index = 0; index < chains.length; index++) {
    const chain = chains[index];
    const result =
      type === VaultType.BORROW
        ? await sdk.getBorrowingVaultsFinancials(chain.chainId, address)
        : await sdk.getLendingVaultsFinancials(chain.chainId, address);
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

export const vaultFromEntity = (
  entity?: AbstractVault | VaultWithFinancials
): AbstractVault | undefined =>
  entity
    ? entity instanceof AbstractVault
      ? entity
      : entity.vault
    : undefined;

export const allAvailableVaults = (): VaultWithFinancials[] => [
  ...useBorrow.getState().availableVaults,
  ...useLend.getState().availableVaults,
];

export const getLlamasWithFinancials =
  async (): FujiResultPromise<GetLLamaFinancialsResponse> => {
    const lastUpdated = await getCacheLastUpdatedDate();
    const cache = await getLlamaCache();
    const now = new Date();

    const shouldFetch =
      !lastUpdated ||
      now.getTime() - lastUpdated.getTime() > CACHE_LIMIT ||
      !cache.lendBorrows ||
      !cache.pools;

    if (shouldFetch) {
      const financialsResult = await sdk.getLLamaFinancials();
      if (!financialsResult.success) {
        return financialsResult;
      }
      const llamas = financialsResult.data;
      setLlamaCache(llamas);
      return new FujiResultSuccess(llamas);
    }
    return new FujiResultSuccess(cache);
  };
