import { BorrowingVault, VaultWithFinancials } from '@x-fuji/sdk';

import { MarketFilters } from '../components/Markets/MarketFiltersHeader';
import { AssetType } from './assets';
import { chainName, chains } from './chains';

export enum MarketRowStatus {
  Ready,
  Loading,
  Error,
}

export type MarketRow = {
  entity?: BorrowingVault | VaultWithFinancials;

  collateral: string;
  debt: string;
  safetyRating: {
    status: MarketRowStatus;
    value: number;
  };

  chain: {
    status: MarketRowStatus;
    value: string;
  };

  depositApr: {
    status: MarketRowStatus;
    value: number;
  };
  depositAprBase: {
    status: MarketRowStatus;
    value: number;
  };
  depositAprReward: {
    status: MarketRowStatus;
    value: number;
  };

  borrowApr: {
    status: MarketRowStatus;
    value: number;
  };
  borrowAprBase: {
    status: MarketRowStatus;
    value: number;
  };
  borrowAprReward: {
    status: MarketRowStatus;
    value: number;
  };

  integratedProviders: {
    status: MarketRowStatus;
    value: string[];
  };
  liquidity: {
    status: MarketRowStatus;
    value: number;
  };

  children?: MarketRow[];
  isChild: boolean;
  isGrandChild: boolean; // TODO: Not handled
  isBest: boolean;
};

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

export const vaultFromEntity = (
  entity?: BorrowingVault | VaultWithFinancials
): BorrowingVault | undefined =>
  entity
    ? entity instanceof BorrowingVault
      ? entity
      : entity.vault
    : undefined;

export const setBase = (v: BorrowingVault): MarketRow => ({
  ...defaultRow,
  entity: v,
  collateral: v.collateral.symbol,
  debt: v.debt.symbol,
  chain: {
    status: MarketRowStatus.Ready,
    value: chainName(v.chainId),
  },
});

// set apr and aprBase as being equal
// and re-set later when data gets fetched from the Llama API
export const setFinancials = (
  r: MarketRow,
  status: MarketRowStatus,
  f?: VaultWithFinancials
): MarketRow => ({
  ...r,
  safetyRating: {
    status,
    value: Number((r.entity as BorrowingVault).safetyRating?.toString()) ?? 0,
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

export const setLlamas = (
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

export const setBest = (rows: MarketRow[]): MarketRow[] => {
  const result: MarketRow[] = [];
  const done = new Set<string>();

  for (const row of rows) {
    const key = `${row.debt}/${row.collateral}`;
    if (done.has(key)) continue;
    done.add(key);

    const entries = rows.filter(
      (r) => r.debt === row.debt && r.collateral === row.collateral
    );
    if (entries.length > 1) {
      const sorted = entries.sort(sortBy.descending);
      const children = groupByChain(sorted);
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

export const groupByPair = (rows: MarketRow[]): MarketRow[] => {
  const done = new Set<string>(); // Pair is symbol/symbol i.e WETH/USDC
  const grouped: MarketRow[] = [];

  for (const row of rows) {
    const key = `${row.debt}/${row.collateral}`;
    if (done.has(key)) continue;
    done.add(key);

    const entries = rows.filter(
      (r) => r.debt === row.debt && r.collateral === row.collateral
    );
    if (entries.length > 1) {
      const sorted = entries.sort(sortBy.descending);
      const children = groupByChain(
        sorted.map((r) => ({
          ...r,
          isChild: true,
        }))
      );
      grouped.push({ ...sorted[0], children });
    } else {
      grouped.push(entries[0]);
    }
  }

  return grouped;
};

export const filterMarketRows = (
  rows: MarketRow[],
  filters: MarketFilters
): MarketRow[] => {
  if (!filters.searchQuery && filters.chains.length === chains.length)
    return groupByPair(rows);
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
          row.debt.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          row.integratedProviders.value.some((provider) =>
            provider.toLowerCase().includes(filters.searchQuery.toLowerCase())
          ));

      if (chainMatch && (!filters.searchQuery || searchQueryMatch)) {
        filteredRows.push(row);
      }
    });
  }

  filterRows(rows, filters);

  return groupByPair(filteredRows);
};

export type AprData = {
  positive: boolean;
  base: number;
  providerName: string;
  type?: AssetType;
  reward?: number;
};

export const aprData = (
  base: number,
  reward?: number,
  type: AssetType = AssetType.Collateral
): Partial<AprData> => {
  return {
    positive:
      type === AssetType.Debt || (reward !== undefined && reward > base),
    reward,
    base,
    type,
  };
};

type SortBy = 'descending' | 'ascending';
type CompareFn = (r1: MarketRow, r2: MarketRow) => 1 | -1;

const groupByChain = (rows: MarketRow[]): MarketRow[] => {
  const done = new Set<string>();
  const grouped: MarketRow[] = [];

  for (const row of rows) {
    const key = row.chain.value;
    if (done.has(key)) continue;
    done.add(key);

    const entries = rows.filter((r) => r.chain.value === row.chain.value);
    if (entries.length > 1) {
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

const sortBy: Record<SortBy, CompareFn> = {
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
