import {
  AbstractVault,
  Address,
  BorrowingVault,
  ChainId,
  CONNEXT_ROUTER_ADDRESS,
  contracts,
  Currency,
  FujiError,
  FujiErrorCode,
  FujiResult,
  FujiResultError,
  FujiResultSuccess,
  LendingVault,
  Sdk,
  VaultType,
  VaultWithFinancials,
} from '@x-fuji/sdk';
import { BigNumber, ethers } from 'ethers';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import produce from 'immer';
import { StoreApi as ZustandStoreApi } from 'zustand';

import { Ltv, NOTIFICATION_MESSAGES } from '../../constants';
import {
  AllowanceStatus,
  AssetChange,
  assetForData,
  AssetType,
  defaultCurrency,
  FetchStatus,
  foundCurrency,
  Mode,
} from '../../helpers/assets';
import { fetchBalances } from '../../helpers/balances';
import { isSupported, testChains } from '../../helpers/chains';
import { isBridgeable } from '../../helpers/currencies';
import { handleTransactionError } from '../../helpers/errors';
import {
  dismiss,
  getTransactionLink,
  NotificationDuration,
  NotificationId,
  notify,
} from '../../helpers/notifications';
import { fetchRoutes, RouteMeta } from '../../helpers/routes';
import { getVaultsWithFinancials } from '../../helpers/vaults';
import { sdk } from '../../services/sdk';
import { useAuth } from '../auth.store';
import { useHistory } from '../history.store';
import { BorrowState, BorrowStore } from './borrow';
import { LendState, LendStore } from './lend';
import { FormType } from './state';

type AbstractState = BorrowState | LendState;
type AbstractStore = BorrowStore | LendStore;
type StoreApi = ZustandStoreApi<AbstractStore>;

export const changeActiveVault = (
  api: StoreApi,
  vaultWithFinancials: VaultWithFinancials
) => {
  const { vault, activeProvider, allProviders, depositBalance, borrowBalance } =
    vaultWithFinancials;

  const ltvMax =
    vault instanceof BorrowingVault && vault.maxLtv
      ? parseInt(formatUnits(vault.maxLtv, 16))
      : Ltv.MAX;
  const ltvThreshold =
    vault instanceof BorrowingVault && vault.liqRatio
      ? parseInt(formatUnits(vault.liqRatio, 16))
      : Ltv.THRESHOLD;

  api.setState(
    produce((state: AbstractState) => {
      const hasDebt = 'debt' in state;
      state.activeVault = hasDebt
        ? (vault as BorrowingVault)
        : (vault as LendingVault);
      state.activeProvider = activeProvider;
      state.allProviders = allProviders;
      const dec = vault.collateral.decimals;
      state.collateral.amount = parseFloat(formatUnits(depositBalance, dec));

      if (!hasDebt || !state.debt || !borrowBalance) return;
      state.ltv.ltvMax = ltvMax;
      state.ltv.ltvThreshold = ltvThreshold;
      const dec2 = state.debt.currency.decimals;
      state.debt.amount = parseFloat(formatUnits(borrowBalance, dec2));
    })
  );
  const route = api
    .getState()
    .availableRoutes.find((r) => r.address === vault.address.value);
  if (route) {
    api.getState().changeTransactionMeta(route);
  }
};

export const changeAll = async (
  api: StoreApi,
  vault: AbstractVault,
  collateral: Currency,
  debt?: Currency
) => {
  const vaultType =
    vault instanceof BorrowingVault ? VaultType.BORROW : VaultType.LEND;
  const collaterals = sdk.getCollateralForChain(collateral.chainId, vaultType);
  const debts = debt && sdk.getDebtForChain(debt.chainId);
  api.setState(
    produce((state: AbstractState) => {
      const hasDebt = 'debt' in state;
      state.activeVault = hasDebt
        ? (vault as BorrowingVault)
        : (vault as LendingVault);

      state.collateral.chainId = collateral.chainId;
      state.collateral.selectableCurrencies = collaterals;
      state.collateral.currency = collateral;

      if (!hasDebt || !debt || !debts) return;
      if (!state.debt) state.debt = assetForData(debt.chainId, debts, debt);
      else {
        state.debt.chainId = debt.chainId;
        state.debt.selectableCurrencies = debts;
        state.debt.currency = debt;
      }
    })
  );

  const state = api.getState();
  state.updateCurrencyPrice(AssetType.Collateral);
  state.updateBalances(AssetType.Collateral);
  state.updateAllowance(AssetType.Collateral);
  if (debt) {
    state.updateCurrencyPrice(AssetType.Debt);
    state.updateBalances(AssetType.Debt);
    state.updateAllowance(AssetType.Debt);
  }

  const addr = useAuth.getState().address;
  const account = addr ? Address.from(addr) : undefined;
  const result = debt
    ? await sdk.getBorrowingVaultsFor(collateral, debt, account)
    : await sdk.getLendingVaultsFor(collateral, account);

  if (!result.success) {
    console.error(result.error.message);
    api.setState({ availableVaultsStatus: FetchStatus.Error });
    return;
  }
  const availableVaults = await getVaultsWithFinancials(result.data);

  api.setState({ availableVaults });

  const e = availableVaults.find((r) => r.vault.address === vault.address);
  if (!e) {
    console.error('Vault not found');
    api.setState({ availableVaultsStatus: FetchStatus.Error });
    return;
  }

  state.changeActiveVault(e);

  state.updateTransactionMeta();
  api.setState({ availableVaultsStatus: FetchStatus.Ready });
};

export const changeAllowance = (
  api: StoreApi,
  assetType: AssetType,
  status: AllowanceStatus,
  amount?: number
) => {
  api.setState(
    produce((s: AbstractState) => {
      if (assetType === AssetType.Collateral) {
        s.collateral.allowance.status = status;
        if (amount !== undefined) s.collateral.allowance.value = amount;
      } else if (assetType === AssetType.Debt && 'debt' in s && s.debt) {
        s.debt.allowance.status = status;
        if (amount !== undefined) s.debt.allowance.value = amount;
      }
    })
  );
};

export const changeAssetChainFor = (
  api: StoreApi,
  assetType: AssetType,
  vaultType: VaultType,
  chainId: ChainId,
  updateVault: boolean,
  currency?: Currency
) => {
  if (!isSupported(chainId)) return;
  const currencies =
    assetType === AssetType.Debt
      ? sdk.getDebtForChain(chainId)
      : sdk.getCollateralForChain(chainId, vaultType);

  if (
    api.getState().formType === FormType.Edit &&
    currency &&
    (!isBridgeable(currency) ||
      !currencies.find((c) => c.symbol === currency.symbol))
  ) {
    notify({
      type: 'error',
      message: `${currency.symbol} not supported cross-chain.`,
    });
    return;
  }
  api.setState(
    produce((state: AbstractState) => {
      const hasDebt = 'debt' in state;
      let t =
        assetType === AssetType.Debt && hasDebt ? state.debt : state.collateral;
      if (!t) {
        t = assetForData(chainId, currencies, defaultCurrency(currencies));
        if (hasDebt && assetType === AssetType.Debt) {
          state.debt = t;
        } else if (assetType === AssetType.Collateral) {
          state.collateral = t;
        }
      } else {
        t.chainId = chainId;
        t.selectableCurrencies = currencies;
        const found = foundCurrency(t.selectableCurrencies, t.currency);
        if (found) t.currency = found;
        else if (state.formType === FormType.Create) t.currency = currencies[0];
      }
    })
  );
  api.getState().updateMeta(assetType, updateVault, true);
};

export const changeAssetCurrency = (
  api: StoreApi,
  assetType: AssetType,
  currency: Currency,
  updateVault: boolean
) => {
  api.setState(
    produce((state: AbstractState) => {
      if (assetType === AssetType.Collateral) {
        state.collateral.currency = currency;
      } else if (
        assetType === AssetType.Debt &&
        'debt' in state &&
        state.debt
      ) {
        state.debt.currency = currency;
      }
    })
  );
  api.getState().updateMeta(assetType, updateVault, false);
};

export const changeAssetValue = (
  api: StoreApi,
  assetType: AssetType,
  value: string
) => {
  api.setState(
    produce((state: AbstractState) => {
      if (assetType === AssetType.Collateral) {
        state.collateral.input = value;
      } else if (
        assetType === AssetType.Debt &&
        'debt' in state &&
        state.debt
      ) {
        state.debt.input = value;
      }
    })
  );
  api.getState().updateTransactionMetaDebounced();
  updateLtvAndLiquidationIfPossible(api);
};

export const changeBalances = (
  api: StoreApi,
  assetType: AssetType,
  balances: Record<string, number>
) => {
  api.setState(
    produce((state: AbstractState) => {
      if (assetType === AssetType.Collateral) {
        state.collateral.balances = balances;
      } else if (
        assetType === AssetType.Debt &&
        'debt' in state &&
        state.debt
      ) {
        state.debt.balances = balances;
      }
    })
  );
};

export const changeFormType = (api: StoreApi, formType: FormType) => {
  api.setState({ formType });
};

export const changeMode = (api: StoreApi, mode: Mode) => {
  const diff = mode !== api.getState().mode;
  api.setState({ mode });
  if (diff) {
    api.getState().updateTransactionMeta();
  }
};

export const changeTransactionMeta = (api: StoreApi, route: RouteMeta) => {
  api.setState(
    produce((state: AbstractState) => {
      state.transactionMeta.status = FetchStatus.Ready;
      state.needsSignature = Sdk.needSignature(route.actions);
      state.transactionMeta.bridgeFees = route.bridgeFees;
      state.transactionMeta.estimateTime = route.estimateTime;
      state.transactionMeta.steps = route.steps;
      state.actions = route.actions;
      state.transactionMeta.estimateSlippage = route.estimateSlippage;
    })
  );
};

export const updateAllowance = async (api: StoreApi, assetType: AssetType) => {
  const asset = api.getState().assetForType(assetType);
  if (!asset) return;
  const currency = asset.currency;
  const address = useAuth.getState().address;

  if (!address) {
    return;
  }
  if (currency.isNative) {
    api.getState().changeAllowance(assetType, AllowanceStatus.Unneeded);
    return;
  }
  api.getState().changeAllowance(assetType, AllowanceStatus.Loading);
  try {
    const res = await sdk.getAllowanceFor(currency, Address.from(address));

    const currentCurrency = api.getState().assetForType(assetType)?.currency;
    if (
      !currentCurrency ||
      currency.address !== currentCurrency.address ||
      currency.chainId !== currentCurrency.chainId
    )
      return;

    const value = parseFloat(formatUnits(res, currency.decimals));
    api.getState().changeAllowance(assetType, AllowanceStatus.Ready, value);
  } catch (e) {
    // TODO: how to handle the case where we can't fetch allowance ?
    console.error(e);
    api.getState().changeAllowance(assetType, AllowanceStatus.Error);
  }
};

export const updateBalances = async (api: StoreApi, assetType: AssetType) => {
  const address = useAuth.getState().address;
  const asset = api.getState().assetForType(assetType);
  if (!address || !asset) {
    return;
  }

  const currencies = asset.selectableCurrencies;
  const currency = asset.currency;
  const chainId = currency.chainId;
  const result = await fetchBalances(currencies, address, chainId);
  if (!result.success) {
    console.error(result.error.message);
    return;
  }
  const currentAsset = api.getState().assetForType(assetType);
  if (!currentAsset) return; // TODO: handle this case?
  const currentCurrency = currentAsset.currency;
  if (
    currency.address !== currentCurrency.address ||
    currency.chainId !== currentCurrency.chainId
  )
    return;
  const balances = result.data;
  api.getState().changeBalances(assetType, balances);
};

export const updateCurrencyPrice = async (
  api: StoreApi,
  assetType: AssetType
) => {
  const asset = api.getState().assetForType(assetType);
  if (!asset) return;
  const currency = asset.currency;

  const result = await currency.getPriceUSD();
  if (!result.success) {
    console.error(result.error.message);
    return;
  }

  const currentCurrency = api.getState().assetForType(assetType)?.currency;
  if (!currentCurrency || currency.address !== currentCurrency.address) return;

  let currencyValue = result.data;
  const isTestNet = testChains.some((c) => c.chainId === currency.chainId);
  if (currency.symbol === 'WETH' && isTestNet) {
    currencyValue = 1242.42; // fix bc weth has no value on testnet
  }

  api.setState(
    produce((state: AbstractState) => {
      if (assetType === AssetType.Collateral) {
        state.collateral.usdPrice = currencyValue;
      } else if ('debt' in state && state.debt) {
        state.debt.usdPrice = currencyValue;
      }
    })
  );

  updateLtvAndLiquidationIfPossible(api);
};

export const updateMeta = (
  api: StoreApi,
  assetType: AssetType,
  updateVault: boolean,
  updateBalance: boolean
) => {
  const state = api.getState();
  state.updateCurrencyPrice(assetType);
  if (updateBalance) {
    state.updateBalances(assetType);
  }
  if (updateVault) {
    state.updateVault();
  } else {
    state.updateTransactionMeta();
  }
  state.updateAllowance(assetType);
};

export const updateTransactionMeta = async (api: StoreApi) => {
  const slippage = useAuth.getState().slippage;
  const address =
    useAuth.getState().address ?? '0x0000000000000000000000000000000000000000';

  const state = api.getState();
  const { activeVault, availableVaults, collateral, mode } = state;

  const hasDebt = 'debt' in state;
  let debt: AssetChange | undefined = undefined;
  if (hasDebt && state.debt === undefined) {
    return;
  } else if (hasDebt) {
    debt = state.debt;
  }

  const collateralInput = collateral.input === '' ? '0' : collateral.input;
  const debtInput = debt?.input === '' ? '0' : debt?.input;
  if (!activeVault) {
    return api.setState(
      produce((state: AbstractState) => {
        state.transactionMeta.status = FetchStatus.Error;
      })
    );
  }

  api.setState(
    produce((state: AbstractState) => {
      state.transactionMeta.status = FetchStatus.Loading;
      state.signature = undefined;
      state.actions = undefined;
    })
  );

  try {
    const formType = api.getState().formType;
    // when editing a position, we need to fetch routes only for the active vault
    const vaults =
      formType === FormType.Create && availableVaults.length > 0
        ? availableVaults.map((e) => e.vault)
        : [activeVault];

    const results = await Promise.all(
      vaults.map((v, i) => {
        const recommended = i === 0;

        return fetchRoutes(
          mode,
          v,
          collateral.currency,
          debt?.currency,
          collateralInput,
          debtInput,
          address,
          recommended,
          slippage
        );
      })
    );

    const error = results.find((r): r is FujiResultError => !r.success);
    if (error) {
      console.error(error);
      //throw error.error;
    }
    // filter valid routes
    const availableRoutes: RouteMeta[] = (
      results.filter(
        (r): r is FujiResult<RouteMeta> => r.success
      ) as FujiResultSuccess<RouteMeta>[]
    ).map((r) => r.data);
    const selectedRoute = availableRoutes.find(
      (r) => r.address === activeVault.address.value
    );
    // no route means that the active vault has changed before the async call completed
    if (!selectedRoute && formType === FormType.Create) {
      api.getState().updateVault();
      return;
    }
    if (!selectedRoute?.actions.length) {
      throw new FujiError(
        'Route found with empty action array',
        FujiErrorCode.SDK
      );
    }

    api.setState({ availableRoutes });
    api.getState().changeTransactionMeta(selectedRoute);
  } catch (e) {
    api.setState(
      produce((state: AbstractState) => {
        state.transactionMeta.status = FetchStatus.Error;
      })
    );
    const message = e instanceof FujiError ? e.message : String(e);
    console.error(message);
  }
};

export const allow = async (
  api: StoreApi,
  assetType: AssetType = AssetType.Collateral
) => {
  const asset = api.getState().assetForType(assetType);
  if (!asset) return;
  const { currency, input } = asset;
  const amount = parseFloat(input);
  const userAddress = useAuth.getState().address;
  const provider = useAuth.getState().provider;
  const spender = CONNEXT_ROUTER_ADDRESS[currency.chainId].value;

  if (!provider || !userAddress) {
    return;
  }
  api.getState().changeAllowance(assetType, AllowanceStatus.Approving);
  const owner = provider.getSigner();
  try {
    const approval = await contracts.ERC20__factory.connect(
      currency.address.value,
      owner
    ).approve(spender, parseUnits(amount.toString(), currency.decimals));
    await approval.wait();

    api.getState().changeAllowance(assetType, AllowanceStatus.Ready, amount);
    notify({
      message: NOTIFICATION_MESSAGES.ALLOWANCE_SUCCESS,
      type: 'success',
      link: getTransactionLink({
        hash: approval.hash,
        chainId: currency.chainId,
      }),
    });
  } catch (e) {
    api.getState().changeAllowance(assetType, AllowanceStatus.Error);
    handleTransactionError(
      e,
      NOTIFICATION_MESSAGES.TX_CANCELLED,
      NOTIFICATION_MESSAGES.ALLOWANCE_FAILURE
    );
  }
};

export const sign = async (api: StoreApi) => {
  const actions = api.getState().actions;
  const vault = api.getState().activeVault;
  const provider = useAuth.getState().provider;
  let notificationId: NotificationId | undefined;
  try {
    if (!actions || !vault || !provider) {
      throw new Error('Unexpected undefined value');
    }

    api.setState({ isSigning: true });

    notificationId = notify({
      type: 'info',
      message: NOTIFICATION_MESSAGES.SIGNATURE_PENDING,
      sticky: true,
    });
    const r = await vault.signPermitFor(actions);
    if (!r.success) {
      throw new Error(r.error.message);
    }
    const { domain, types, value } = r.data;
    const signer = provider.getSigner();
    const s = await signer._signTypedData(domain, types, value);
    const signature = ethers.utils.splitSignature(s);

    api.setState({ signature });
  } catch (e: unknown) {
    handleTransactionError(e, NOTIFICATION_MESSAGES.SIGNATURE_CANCELLED);
  } finally {
    if (notificationId) {
      dismiss(notificationId);
    }
    api.setState({ isSigning: false });
  }
};

export const execute = async (
  api: StoreApi
): Promise<ethers.providers.TransactionResponse | undefined> => {
  const { address, provider } = useAuth.getState();
  const { actions, signature, transactionMeta, needsSignature } =
    api.getState();
  if (!actions || !address || !provider || (needsSignature && !signature)) {
    return;
  }
  const notificationId = notify({
    type: 'info',
    message: NOTIFICATION_MESSAGES.TX_PENDING,
    sticky: true,
  });

  const srcChainId = transactionMeta.steps[0].chainId;

  api.setState({ isExecuting: true });

  const result = sdk.getTxDetails(
    actions,
    srcChainId,
    Address.from(address),
    signature
  );
  if (!result.success) {
    dismiss(notificationId);
    notify({ type: 'error', message: result.error.message });
    return;
  }
  const txRequest = result.data;

  try {
    const signer = provider.getSigner();
    const estimated = await signer.estimateGas(txRequest);
    // increase by 20% to prevent outOfGas tx failing
    const gasLimit = estimated.add(estimated.div(BigNumber.from('2')));

    const tx = await signer.sendTransaction({ ...txRequest, gasLimit });

    if (tx) {
      notify({
        type: 'success',
        message: NOTIFICATION_MESSAGES.TX_SENT,
        duration: NotificationDuration.LONG,
        link: getTransactionLink({
          hash: tx.hash,
          chainId: srcChainId,
        }),
      });
    }
    return tx;
  } catch (e) {
    handleTransactionError(
      e,
      NOTIFICATION_MESSAGES.TX_CANCELLED,
      NOTIFICATION_MESSAGES.TX_NOT_SENT
    );
  } finally {
    dismiss(notificationId);
    api.setState({ isExecuting: false });
  }
};

export const signAndExecute = async (api: StoreApi, assetType: VaultType) => {
  if (api.getState().needsSignature) {
    await api.getState().sign();
  }

  const tx = await api.getState().execute();
  const vault = api.getState().activeVault;

  // error was already displayed in execute()
  if (tx && vault) {
    useHistory
      .getState()
      .add(
        assetType,
        tx.hash,
        tx.from,
        vault,
        api.getState().transactionMeta.steps
      );

    api.getState().clearInputValues();
  }
};

const updateLtvAndLiquidationIfPossible = (api: StoreApi) => {
  const state = api.getState();
  if ('updateLtv' in state && 'updateLiquidation' in state) {
    state.updateLtv();
    state.updateLiquidation();
  }
};
