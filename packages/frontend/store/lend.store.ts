import { Address, VaultType } from '@x-fuji/sdk';
import { debounce } from 'debounce';
import { setAutoFreeze } from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { TRANSACTION_META_DEBOUNCE_INTERVAL } from '../constants';
import { AssetType, FetchStatus, Mode } from '../helpers/assets';
import { storeOptions } from '../helpers/stores';
import { getVaultsWithFinancials } from '../helpers/vaults';
import { sdk } from '../services/sdk';
import { useAuth } from './auth.store';
import {
  allow,
  changeActiveVault,
  changeAll,
  changeAllowance,
  changeAssetChainFor,
  changeAssetCurrency,
  changeAssetValue,
  changeBalances,
  changeFormType,
  changeMode,
  changeTransactionMeta,
  execute,
  sign,
  signAndExecute,
  updateAllowance,
  updateBalances,
  updateCurrencyPrice,
  updateMeta,
  updateTransactionMeta,
} from './types/actions';
import { initialLendState, LendStore } from './types/lend';

setAutoFreeze(false);

export const useLend = create<LendStore>()(
  devtools(
    (set, get, api) => ({
      ...initialLendState,

      assetForType() {
        return get().collateral;
      },

      changeActiveVault(vault) {
        changeActiveVault(api, vault);
      },

      async changeAll(vault, collateral) {
        changeAll(api, vault, collateral);
      },

      async changeAllowance(assetType, status, amount) {
        if (assetType === AssetType.Debt) return;
        changeAllowance(api, assetType, status, amount);
      },

      changeAssetChain(assetType, chainId, updateVault, currency) {
        if (assetType === AssetType.Debt) return;
        changeAssetChainFor(
          api,
          assetType,
          VaultType.LEND,
          chainId,
          updateVault,
          currency
        );
      },

      changeAssetCurrency(assetType, currency, updateVault) {
        if (assetType === AssetType.Debt) return;
        changeAssetCurrency(api, assetType, currency, updateVault);
      },

      changeAssetValue(assetType, value) {
        if (assetType === AssetType.Debt) return;
        changeAssetValue(api, assetType, value);
      },

      async changeBalances(assetType, balances) {
        if (assetType === AssetType.Debt) return;
        changeBalances(api, assetType, balances);
      },

      async changeFormType(formType) {
        changeFormType(api, formType);
      },

      async changeMode(mode) {
        if (mode !== Mode.DEPOSIT && mode !== Mode.WITHDRAW) return;
        changeMode(api, mode);
      },

      changeTransactionMeta(route) {
        changeTransactionMeta(api, route);
      },

      async clearInputValues() {
        await get().changeAssetValue(AssetType.Collateral, '');
      },

      async updateAll(vaultAddress) {
        await get().updateBalances(AssetType.Collateral);
        await get().updateAllowance(AssetType.Collateral);
        await get().updateVault(vaultAddress);
      },

      async updateAllowance(assetType) {
        if (assetType === AssetType.Debt) return;
        updateAllowance(api, assetType);
      },

      async updateBalances(assetType) {
        if (assetType === AssetType.Debt) return;
        updateBalances(api, assetType);
      },

      async updateCurrencyPrice(assetType) {
        if (assetType === AssetType.Debt) return;
        updateCurrencyPrice(api, assetType);
      },

      async updateMeta(assetType, updateVault, updateBalance) {
        if (assetType === AssetType.Debt) return;
        updateMeta(api, assetType, updateVault, updateBalance);
      },

      async updateTransactionMeta() {
        updateTransactionMeta(api);
      },

      updateTransactionMetaDebounced: debounce(
        () => get().updateTransactionMeta(),
        TRANSACTION_META_DEBOUNCE_INTERVAL
      ),

      async updateVault(vaultAddress) {
        set({ availableVaultsStatus: FetchStatus.Loading });

        const collateral = get().collateral.currency;
        const addr = useAuth.getState().address;
        const account = addr ? Address.from(addr) : undefined;

        console.log('account', account);
        const result = await sdk.getLendingVaultsFor(collateral, account);
        console.log('result', result);

        if (!result.success) {
          console.error(result.error.message);
          set({ availableVaultsStatus: FetchStatus.Error });
          return;
        }
        // check if currencies already changed before the previous async call completed
        if (!collateral.equals(get().collateral.currency)) {
          await get().updateVault();
          return;
        }

        let availableVaults = result.data;

        if (availableVaults.length === 0) {
          console.error('No available vault');
          set({ availableVaultsStatus: FetchStatus.Error });
          return;
        }

        availableVaults = await getVaultsWithFinancials(availableVaults);

        const activeVault =
          availableVaults.find((v) => v.vault.address.value === vaultAddress) ??
          availableVaults[0];

        set({ availableVaults });
        get().changeActiveVault(activeVault);

        get().updateTransactionMeta();
        set({ availableVaultsStatus: FetchStatus.Ready });
      },

      async allow(assetType) {
        if (assetType === AssetType.Debt) return;
        allow(api, assetType);
      },

      async sign() {
        await sign(api);
      },

      async execute() {
        return await execute(api);
      },

      async signAndExecute() {
        await signAndExecute(api, VaultType.LEND);
      },
    }),
    storeOptions('lend')
  )
);
