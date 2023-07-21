import { Address, VaultType } from '@x-fuji/sdk';
import { debounce } from 'debounce';
import { setAutoFreeze } from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { TRANSACTION_META_DEBOUNCE_INTERVAL } from '../constants';
import { AssetType, FetchStatus, Mode } from '../helpers/assets';
import { notify } from '../helpers/notifications';
import { storeOptions } from '../helpers/stores';
import { sdk } from '../services/sdk';
import { useAuth } from './auth.store';
import {
  allow,
  changeActiveVault,
  changeAll,
  changeAllowance,
  changeAssetChain,
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

      async changeAllowance(type, status, amount) {
        if (type === AssetType.Debt) return;
        changeAllowance(api, type, status, amount);
      },

      changeAssetChain(type, chainId, updateVault, currency) {
        if (type === AssetType.Debt) return;
        changeAssetChain(api, type, chainId, updateVault, currency);
      },

      changeAssetCurrency(type, currency, updateVault) {
        if (type === AssetType.Debt) return;
        changeAssetCurrency(api, type, currency, updateVault);
      },

      changeAssetValue(type, value) {
        if (type === AssetType.Debt) return;
        changeAssetValue(api, type, value);
      },

      async changeBalances(type, balances) {
        if (type === AssetType.Debt) return;
        changeBalances(api, type, balances);
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

      async updateAllowance(type) {
        if (type === AssetType.Debt) return;
        updateAllowance(api, type);
      },

      async updateBalances(type) {
        if (type === AssetType.Debt) return;
        updateBalances(api, type);
      },

      async updateCurrencyPrice(type) {
        if (type === AssetType.Debt) return;
        updateCurrencyPrice(api, type);
      },

      async updateMeta(type, updateVault, updateBalance) {
        if (type === AssetType.Debt) return;
        updateMeta(api, type, updateVault, updateBalance);
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

        const result = await sdk.getLendingVaultsFor(collateral, account);

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

        const llamaResult = await sdk.getLlamaFinancials(availableVaults);

        if (!llamaResult.success) {
          notify({
            type: 'error',
            message: llamaResult.error.message,
          });
        }

        availableVaults =
          llamaResult.success && llamaResult.data
            ? llamaResult.data
            : availableVaults;

        const activeVault =
          availableVaults.find((v) => v.vault.address.value === vaultAddress) ??
          availableVaults[0];

        set({ availableVaults });
        get().changeActiveVault(activeVault);

        get().updateTransactionMeta();
        set({ availableVaultsStatus: FetchStatus.Ready });
      },

      async allow(type) {
        if (type === AssetType.Debt) return;
        allow(api, type);
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
