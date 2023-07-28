import {
  AbstractVault,
  Address,
  BorrowingVault,
  FujiError,
  VaultType,
  VaultWithFinancials,
} from '@x-fuji/sdk';
import { StoreApi } from 'zustand';

import { MarketFilters } from '../components/Markets/MarketFiltersHeader';
import { sdk } from '../services/sdk';
import {
  MarketRow,
  MarketRowStatus,
  MarketsStore,
} from '../store/types/markets';
import { AssetType } from './assets';
import { chainName, chains } from './chains';
import { shouldShowStoreNotification } from './navigation';
import { notify, showOnchainErrorNotification } from './notifications';
import { getVaultFinancials, vaultsFromFinancialsOrError } from './vaults';

const defaultRow: MarketRow = {
  collateral: '',
  debt: '',
  safetyRating: {
    status: MarketRowStatus.Loading,
    value: 0,
  },
  chain: {
    status: MarketRowStatus.Loading,
    value: '',
  },
  depositApr: {
    status: MarketRowStatus.Loading,
    value: 0,
  },
  depositAprBase: {
    status: MarketRowStatus.Loading,
    value: 0,
  },
  depositAprReward: {
    status: MarketRowStatus.Loading,
    value: 0,
  },
  borrowApr: {
    status: MarketRowStatus.Loading,
    value: 0,
  },
  borrowAprBase: {
    status: MarketRowStatus.Loading,
    value: 0,
  },
  borrowAprReward: {
    status: MarketRowStatus.Loading,
    value: 0,
  },
  integratedProviders: {
    status: MarketRowStatus.Loading,
    value: [],
  },
  liquidity: {
    status: MarketRowStatus.Loading,
    value: 0,
  },
  isChild: false,
  isGrandChild: false,
  isBest: false,
};

type SortBy = 'descending' | 'ascending';
type CompareFn = (r1: MarketRow, r2: MarketRow) => 1 | -1;

export const filterMarketRows = (
  rows: MarketRow[],
  filters: MarketFilters,
  type: VaultType
): MarketRow[] => {
  if (!filters.searchQuery && filters.chains.length === chains.length)
    return groupByPair(rows, type);
  const filteredRows: MarketRow[] = [];

  function filterRows(rows: MarketRow[], filters: MarketFilters) {
    rows.forEach((row) => {
      const chainMatch =
        filters.chains && filters.chains.length > 0
          ? filters.chains.includes(row.chain.value)
          : false;

      const searchQueryMatch =
        filters.searchQuery &&
        (row.collateral
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) ||
          row.debt?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          row.integratedProviders.value.some((provider) =>
            provider.toLowerCase().includes(filters.searchQuery.toLowerCase())
          ));

      if (chainMatch && (!filters.searchQuery || searchQueryMatch)) {
        filteredRows.push(row);
      }
    });
  }

  filterRows(rows, filters);

  return groupByPair(filteredRows, type);
};

export type AprData = {
  positive: boolean;
  base: number;
  providerName: string;
  assetType?: AssetType;
  reward?: number;
};

export const aprData = (
  base: number,
  reward?: number,
  assetType: AssetType = AssetType.Collateral
): Partial<AprData> => {
  return {
    positive:
      assetType === AssetType.Debt || (reward !== undefined && reward > base),
    reward,
    base,
    assetType,
  };
};

const groupByPair = (rows: MarketRow[], type: VaultType): MarketRow[] => {
  const done = new Set<string>(); // Pair is symbol/symbol i.e WETH/USDC
  const grouped: MarketRow[] = [];

  const isLend = type === VaultType.LEND;

  for (const row of rows) {
    const key = `${row.debt}/${row.collateral}`;
    if (done.has(key)) continue;
    done.add(key);

    const entries = rows.filter(
      (r) => r.debt === row.debt && r.collateral === row.collateral
    );
    if (entries.length > 1) {
      const sortBy = isLend ? sortByLendAPY : sortByBorrowAPR;
      const sorted = entries.sort(sortBy.descending);
      const children = groupByChain(
        sorted.map((r) => ({
          ...r,
          isChild: true,
        })),
        type
      );
      grouped.push({ ...sorted[0], children });
    } else {
      grouped.push(entries[0]);
    }
  }

  return grouped;
};

const groupByChain = (rows: MarketRow[], type: VaultType): MarketRow[] => {
  const done = new Set<string>();
  const grouped: MarketRow[] = [];
  const isLend = type === VaultType.LEND;

  for (const row of rows) {
    const key = row.chain.value;
    if (done.has(key)) continue;
    done.add(key);

    const entries = rows.filter((r) => r.chain.value === row.chain.value);
    if (entries.length > 1) {
      const sortBy = isLend ? sortByLendAPY : sortByBorrowAPR;
      const sorted = entries.sort(sortBy.descending);

      const children = sorted.map((r) => ({
        ...r,
        isChild: true,
      }));
      grouped.push({ ...sorted[0], children });
    } else {
      grouped.push(entries[0]);
    }
  }

  return grouped;
};

const sortByBorrowAPR: Record<SortBy, CompareFn> = {
  ascending: (a, b) =>
    a.borrowAprBase.value - (Number(a.borrowAprReward.value) || 0) <
    b.borrowAprBase.value - (Number(b.borrowAprReward.value) || 0)
      ? 1
      : -1,
  descending: (a, b) =>
    a.borrowAprBase.value - (Number(a.borrowAprReward.value) || 0) >
    b.borrowAprBase.value - (Number(b.borrowAprReward.value) || 0)
      ? 1
      : -1,
};

const sortByLendAPY: Record<SortBy, CompareFn> = {
  ascending: (a, b) =>
    a.depositAprBase.value + (Number(a.depositAprReward.value) || 0) <
    b.depositAprBase.value + (Number(b.depositAprReward.value) || 0)
      ? 1
      : -1,
  descending: (a, b) =>
    a.depositAprBase.value + (Number(a.depositAprReward.value) || 0) >
    b.depositAprBase.value + (Number(b.depositAprReward.value) || 0)
      ? 1
      : -1,
};

export const fetchMarkets = async (
  type: VaultType,
  api: StoreApi<MarketsStore>,
  addr?: string
) => {
  const vaults =
    type === VaultType.BORROW
      ? sdk.getAllBorrowingVaults()
      : sdk.getAllLendingVaults();
  const rowsBase = vaults.map(setBase);

  api.getState().changeVaults(type, vaults);
  api.getState().changeRowsIfNeeded(type, rowsBase);

  const address = addr ? Address.from(addr) : undefined;
  const result = await getVaultFinancials(type, address);
  const errors: FujiError[] = result.data.filter(
    (d) => d instanceof FujiError
  ) as FujiError[];
  const allVaults = vaultsFromFinancialsOrError(result.data);
  if (shouldShowStoreNotification('markets')) {
    errors.forEach((error) => {
      showOnchainErrorNotification(error);
    });
  }
  if (allVaults.length === 0) {
    const rows = rowsBase
      .map((r) => setFinancials(r, MarketRowStatus.Error))
      .map((r) => setLlamas(r, MarketRowStatus.Error));
    api.getState().changeRows(type, setBest(rows, type));
  }
  const vaultsWithFinancials = result.data;
  const rowsFin = vaultsWithFinancials.map((obj, i) => {
    const fin = obj instanceof FujiError ? undefined : obj;
    const status =
      obj instanceof FujiError ? MarketRowStatus.Error : MarketRowStatus.Ready;
    return setFinancials(rowsBase[i], status, fin);
  });
  const currentFinancials = vaultsFromFinancialsOrError(
    api.getState().vaultsWithFinancials(type)
  );
  if (
    currentFinancials.length === 0 ||
    currentFinancials.length !== allVaults.length
  ) {
    api.getState().changeRows(type, setBest(rowsFin, type));
    api.getState().changeVaultsWithFinancials(type, vaultsWithFinancials);
  }
  const llamaResult = await sdk.getLlamaFinancials(allVaults);
  if (!llamaResult.success) {
    notify({
      type: 'error',
      message: llamaResult.error.message,
    });
    const rows = rowsFin.map((r) => setLlamas(r, MarketRowStatus.Error));
    api.getState().changeRows(type, setBest(rows, type));
    return;
  }
  const vaultsWithLlamas = llamaResult.data;
  const rowsLlama = vaultsWithFinancials.map((obj, i) => {
    const llama =
      obj instanceof FujiError
        ? undefined
        : vaultsWithLlamas.find(
            (l) => l.vault.address.value === obj.vault.address.value
          );
    return setLlamas(
      rowsFin[i],
      llama ? MarketRowStatus.Ready : MarketRowStatus.Error,
      llama
    );
  });
  api
    .getState()
    .changeRowsAndFinancials(type, setBest(rowsLlama, type), vaultsWithLlamas);
};

const setBase = (v: AbstractVault): MarketRow => ({
  ...defaultRow,
  entity: v,
  collateral: v.collateral.symbol,
  debt: v instanceof BorrowingVault ? v.debt.symbol : undefined,
  chain: {
    status: MarketRowStatus.Ready,
    value: chainName(v.chainId),
  },
});

// set apr and aprBase as being equal
// and re-set later when data gets fetched from the Llama API
const setFinancials = (
  r: MarketRow,
  status: MarketRowStatus,
  f?: VaultWithFinancials
): MarketRow => ({
  ...r,
  safetyRating: {
    status,
    value: Number((r.entity as AbstractVault).safetyRating?.toString()) ?? 0,
  },
  depositApr: {
    status,
    value: f?.activeProvider.depositAprBase ?? 0,
  },
  depositAprBase: {
    status,
    value: f?.activeProvider.depositAprBase ?? 0,
  },
  borrowApr: {
    status,
    value: f?.activeProvider.borrowAprBase ?? 0,
  },
  borrowAprBase: {
    status,
    value: f?.activeProvider.borrowAprBase ?? 0,
  },
  integratedProviders: {
    status,
    value: f?.allProviders.map((p) => p.name) ?? [],
  },
});

const setLlamas = (
  r: MarketRow,
  status: MarketRowStatus,
  f?: VaultWithFinancials
): MarketRow => {
  if (status === MarketRowStatus.Ready) {
    return {
      ...r,
      depositApr: {
        status,
        value:
          Number(f?.activeProvider.depositAprBase) +
          Number(f?.activeProvider.depositAprReward ?? 0),
      },
      depositAprReward: {
        status:
          f?.activeProvider.depositAprReward === undefined
            ? MarketRowStatus.Error
            : status,
        value: Number(f?.activeProvider.depositAprReward),
      },
      borrowApr: {
        status,
        value:
          Number(f?.activeProvider.borrowAprBase) +
          Number(f?.activeProvider.borrowAprReward ?? 0),
      },
      borrowAprReward: {
        status:
          f?.activeProvider.borrowAprReward === undefined
            ? MarketRowStatus.Error
            : status,
        value: Number(f?.activeProvider.borrowAprReward),
      },
      liquidity: {
        status:
          f?.activeProvider.availableToBorrowUSD === undefined
            ? MarketRowStatus.Error
            : status,
        value: f?.activeProvider.availableToBorrowUSD ?? 0,
      },
    };
  } else {
    return {
      ...r,
      depositAprReward: {
        status,
        value: 0,
      },
      borrowAprReward: {
        status,
        value: 0,
      },
      liquidity: {
        status,
        value: 0,
      },
    };
  }
};

const setBest = (rows: MarketRow[], type: VaultType): MarketRow[] => {
  const result: MarketRow[] = [];
  const done = new Set<string>();

  const isLend = type === VaultType.LEND;

  for (const row of rows) {
    const key = `${row.debt}/${row.collateral}`;
    if (done.has(key)) continue;
    done.add(key);

    const entries = rows.filter(
      (r) => r.debt === row.debt && r.collateral === row.collateral
    );
    if (entries.length > 1) {
      const sortBy = isLend ? sortByLendAPY : sortByBorrowAPR;
      const sorted = entries.sort(sortBy.descending);
      const children = groupByChain(sorted, type);
      children[0].isBest = true;
      if (children[0].children) {
        children[0].children[0].isBest = true;
      }
      result.push(...children);
    } else {
      result.push({ ...entries[0], isBest: true });
    }
  }

  return result;
};
