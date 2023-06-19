import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { DUST_AMOUNT, NOTIFICATION_MESSAGES } from '../constants';
import { AssetType } from '../helpers/assets';
import { notify } from '../helpers/notifications';
import {
  getAccrual,
  getCurrentAvailableBorrowingPower,
  getPositionsWithBalance,
  getTotalSum,
} from '../helpers/positions';
import { storeOptions } from '../helpers/stores';
import { useAuth } from './auth.store';
import { Position } from './models/Position';

type PositionsState = {
  positions: Position[];
  totalDepositsUSD?: number;
  totalDebtUSD?: number;
  totalAPY?: number;
  availableBorrowPowerUSD?: number;
  loading: boolean;
};

type PositionsActions = {
  fetchUserPositions: () => void;
};

const initialState: PositionsState = {
  positions: [],
  loading: false,
};

export type PositionsStore = PositionsState & PositionsActions;

export const usePositions = create<PositionsStore>()(
  devtools(
    (set) => ({
      ...initialState,

      fetchUserPositions: async () => {
        set({ loading: true });
        const addr = useAuth.getState().address;
        const result = addr
          ? await getPositionsWithBalance(addr)
          : { success: true, error: undefined, data: [] };

        if (!result.success) {
          console.error(result.error?.message);
          notify({
            type: 'error',
            message: NOTIFICATION_MESSAGES.POSITIONS_FAILURE,
          });
        }
        const positions = result.success
          ? (result.data as Position[]).filter(
              (p) => p.collateral.amount > DUST_AMOUNT
            )
          : [];

        const totalDepositsUSD = getTotalSum(positions, AssetType.Collateral);
        const totalDebtUSD = getTotalSum(positions, AssetType.Debt);

        const totalAccrued = positions.reduce((acc, p) => {
          const accrueCollateral = getAccrual(
            p.collateral.amount * p.collateral.usdPrice,
            AssetType.Collateral,
            p.collateral.baseAPR
          );
          const accrueDebt = getAccrual(
            p.debt.amount * p.debt.usdPrice,
            AssetType.Debt,
            p.debt.baseAPR
          );
          return accrueCollateral + accrueDebt + acc;
        }, 0);
        // `totalAPY` is scaled up by 100 to express in percentage %.
        const totalAPY = totalDepositsUSD
          ? (totalAccrued * 100) / totalDepositsUSD
          : 0;

        const availableBorrowPowerUSD =
          getCurrentAvailableBorrowingPower(positions);

        set(() => {
          return {
            positions,
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
