import { VaultType } from '@x-fuji/sdk';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { AssetType } from '../helpers/assets';
import { shouldShowStoreNotification } from '../helpers/navigation';
import { showOnchainErrorNotification } from '../helpers/notifications';
import {
  getAccrual,
  getCurrentAvailableBorrowingPower,
  getPositionsWithBalance,
  getTotalSum,
} from '../helpers/positions';
import { storeOptions } from '../helpers/stores';
import { useAuth } from './auth.store';
import { BorrowingPosition, Position } from './models/Position';

type PositionsState = {
  borrowPositions: BorrowingPosition[];
  lendingPositions: Position[];
  totalDepositsUSD?: number;
  totalDebtUSD?: number;
  totalAPY?: number;
  availableBorrowPowerUSD?: number;
  loading: boolean;
};

type PositionsActions = {
  allPositions: () => Position[];
  fetchUserPositions: () => void;
};

const initialState: PositionsState = {
  borrowPositions: [],
  lendingPositions: [],
  loading: false,
};

type PositionsStore = PositionsState & PositionsActions;

export const usePositions = create<PositionsStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      allPositions: () => {
        return [...get().borrowPositions, ...get().lendingPositions];
      },

      fetchUserPositions: async () => {
        set({ loading: true });

        const addr = useAuth.getState().address;
        const borrowResult = await getPositionsWithBalance(
          VaultType.BORROW,
          addr
        );

        const lendingResult = await getPositionsWithBalance(
          VaultType.LEND,
          addr
        );
        const error = !borrowResult.success
          ? borrowResult.error
          : !lendingResult.success
          ? lendingResult.error
          : undefined;
        if (error) {
          console.error(error.message);
          if (shouldShowStoreNotification('positions') && error) {
            showOnchainErrorNotification(error);
          }
        }
        const borrowPositions = borrowResult.success
          ? (borrowResult.data as BorrowingPosition[])
          : [];
        const lendingPositions = lendingResult.success
          ? lendingResult.data
          : [];

        const totalDepositsUSD =
          getTotalSum(borrowPositions, AssetType.Collateral) +
          getTotalSum(lendingPositions, AssetType.Collateral);
        const totalDebtUSD = getTotalSum(borrowPositions, AssetType.Debt);

        const totalAccrued = [...borrowPositions, ...lendingPositions].reduce(
          (acc, p) => {
            const accrueCollateral = getAccrual(
              p.collateral.amount * p.collateral.usdPrice,
              AssetType.Collateral,
              p.collateral.baseAPR
            );
            const accrueDebt =
              p.type === VaultType.BORROW && p.debt
                ? getAccrual(
                    p.debt.amount * p.debt.usdPrice,
                    AssetType.Debt,
                    p.debt.baseAPR
                  )
                : 0;
            return accrueCollateral + accrueDebt + acc;
          },
          0
        );
        // `totalAPY` is scaled up by 100 to express in percentage %.
        const totalAPY = totalDepositsUSD
          ? (totalAccrued * 100) / totalDepositsUSD
          : 0;

        const availableBorrowPowerUSD =
          getCurrentAvailableBorrowingPower(borrowPositions);

        set(() => {
          return {
            borrowPositions,
            lendingPositions,
            totalDepositsUSD,
            totalDebtUSD,
            totalAPY: parseFloat(totalAPY.toFixed(2)),
            availableBorrowPowerUSD,
            loading: false,
          };
        });
      },
    }),
    storeOptions('positions')
  )
);
