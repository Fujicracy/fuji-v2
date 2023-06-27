import {
  AbstractVault,
  BorrowingVault,
  LendingVault,
  VaultType,
  VaultWithFinancials,
} from '@x-fuji/sdk';

import { FinancialsOrError } from '../../helpers/vaults';

export enum MarketRowStatus {
  Ready,
  Loading,
  Error,
}

export type MarketRow = {
  entity?: AbstractVault | VaultWithFinancials;

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

type MarketData = {
  rows: MarketRow[];
  vaults: BorrowingVault[];
  vaultsWithFinancials: FinancialsOrError[];
};

type BorrowData = Omit<MarketData, 'vaults'> & {
  vaults: BorrowingVault[];
};

type LendingData = Omit<MarketData, 'vaults'> & {
  vaults: LendingVault[];
};

type MarketsState = {
  borrow: BorrowData;
  lending: LendingData;
  loading: boolean;
};

type MarketsActions = {
  fetchMarkets: (addr?: string) => void;

  changeRows: (type: VaultType, rows: MarketRow[]) => void;
  changeRowsAndFinancials: (
    type: VaultType,
    rows: MarketRow[],
    vaultsWithFinancials: FinancialsOrError[]
  ) => void;
  changeRowsIfNeeded: (type: VaultType, rows: MarketRow[]) => void;
  changeVaults: (type: VaultType, vaults: AbstractVault[]) => void;
  changeVaultsWithFinancials: (
    type: VaultType,
    vaultsWithFinancials: FinancialsOrError[]
  ) => void;

  vaultsWithFinancials: (type: VaultType) => FinancialsOrError[];
};

const initialDataState = {
  rows: [],
  vaults: [],
  vaultsWithFinancials: [],
};

export const initialMarketsState: MarketsState = {
  borrow: initialDataState,
  lending: initialDataState,
  loading: false,
};

export type MarketsStore = MarketsState & MarketsActions;
