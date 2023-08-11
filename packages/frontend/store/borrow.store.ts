import { Address, VaultType } from '@x-fuji/sdk';
import { debounce } from 'debounce';
import produce, { setAutoFreeze } from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { TRANSACTION_META_DEBOUNCE_INTERVAL } from '../constants';
import { AssetType, FetchStatus } from '../helpers/assets';
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
import { BorrowState, BorrowStore, initialBorrowState } from './types/borrow';

setAutoFreeze(false);

export const useBorrow = create<BorrowStore>()(
  devtools(
    (set, get, api) => ({
      ...initialBorrowState,

      assetForType(assetType) {
        return assetType === AssetType.Collateral
          ? get().collateral
          : get().debt;
      },

      changeActiveVault(vault) {
        changeActiveVault(api, vault);
      },

      async changeAll(vault, collateral, debt) {
        changeAll(api, vault, collateral, debt);
      },

      async changeAllowance(assetType, status, amount) {
        changeAllowance(api, assetType, status, amount);
      },

      changeAssetChain(assetType, chainId, updateVault, currency) {
        changeAssetChainFor(
          api,
          assetType,
          VaultType.BORROW,
          chainId,
          updateVault,
          currency
        );
      },

      changeAssetCurrency(assetType, currency, updateVault) {
        changeAssetCurrency(api, assetType, currency, updateVault);
      },

      changeAssetValue(assetType, value) {
        changeAssetValue(api, assetType, value);
      },

      async changeBalances(assetType, balances) {
        changeBalances(api, assetType, balances);
      },

      async changeDebt(debt) {
        set({ debt });
      },

      async changeFormType(formType) {
        changeFormType(api, formType);
      },

      async changeMode(mode) {
        changeMode(api, mode);
      },

      changeTransactionMeta(route) {
        changeTransactionMeta(api, route);
      },

      async clearDebt() {
        set({ debt: undefined });
      },

      async clearInputValues() {
        await get().changeAssetValue(AssetType.Collateral, '');
        await get().changeAssetValue(AssetType.Debt, '');
      },

      async updateAll(vaultAddress) {
        await get().updateBalances(AssetType.Collateral);
        await get().updateBalances(AssetType.Debt);
        await get().updateAllowance(AssetType.Collateral);
        await get().updateAllowance(AssetType.Debt);
        await get().updateVault(vaultAddress);
      },

      async updateAllowance(assetType) {
        updateAllowance(api, assetType);
      },

      async updateBalances(assetType) {
        updateBalances(api, assetType);
      },

      async updateCurrencyPrice(assetType) {
        updateCurrencyPrice(api, assetType);
      },

      updateLiquidation() {
        const debt = get().debt;
        if (!debt) return;
        const collateralAmount = parseFloat(get().collateral.input);
        const collateralPrice = get().collateral.usdPrice;

        const debtAmount = parseFloat(debt.input);
        const debtPrice = debt.usdPrice;
        const debtValue = debtAmount * debtPrice;

        if (!debtValue || !collateralAmount) {
          return set(
            produce((s: BorrowState) => {
              s.liquidationMeta.liquidationPrice = 0;
              s.liquidationMeta.liquidationDiff = 0;
            })
          );
        }

        const liquidationThreshold = get().ltv.ltvThreshold;

        const liquidationPrice =
          debtValue / (collateralAmount * (liquidationThreshold / 100));
        const liquidationDiff = Math.round(
          (1 - liquidationPrice / collateralPrice) * 100
        );

        set(
          produce((s: BorrowState) => {
            s.liquidationMeta.liquidationPrice = liquidationPrice;
            s.liquidationMeta.liquidationDiff = liquidationDiff;
          })
        );
      },

      updateLtv() {
        const debt = get().debt;
        if (!debt) return;
        const collateralAmount = parseFloat(get().collateral.input);
        const collateralPrice = get().collateral.usdPrice;
        const collateralValue = collateralAmount * collateralPrice;

        const debtAmount = parseFloat(debt.input);
        const debtPrice = debt.usdPrice;
        const debtValue = debtAmount * debtPrice;

        const ltv =
          collateralValue && debtValue
            ? Math.round((debtValue / collateralValue) * 100)
            : 0;

        set(
          produce((s: BorrowState) => {
            s.ltv.ltv = ltv;
          })
        );
      },

      async updateMeta(assetType, updateVault, updateBalance) {
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
        const debt = get().debt?.currency;
        if (!debt) return;
        set({ availableVaultsStatus: FetchStatus.Loading });

        const collateral = get().collateral.currency;
        const addr = useAuth.getState().address;
        const account = addr ? Address.from(addr) : undefined;

        const result = await sdk.getBorrowingVaultsFor(
          collateral,
          debt,
          account
        );

        if (!result.success) {
          console.error(result.error.message);
          set({ availableVaultsStatus: FetchStatus.Error });
          return;
        }
        // check if currencies already changed before the previous async call completed
        const currentDebt = get().debt;
        if (
          !collateral.equals(get().collateral.currency) ||
          (currentDebt && !debt.equals(currentDebt.currency))
        ) {
          await get().updateVault();
          return;
        }

        let availableVaults = result.data;
        if (availableVaults.length === 0) {
          console.error('No available vault');
          set({ availableVaults: [] });
          set({ availableVaultsStatus: FetchStatus.Ready });
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
        allow(api, assetType);
      },

      async sign() {
        await sign(api);
      },

      async execute() {
        return await execute(api);
      },

      async signAndExecute() {
        await signAndExecute(api, VaultType.BORROW);
      },
    }),
    storeOptions('borrow')
  )
);
