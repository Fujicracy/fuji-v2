import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { DUST_AMOUNT } from '../constants';
import {
  getAccrual,
  getCurrentAvailableBorrowingPower,
  getPositionsWithBalance,
  getTotalSum,
} from '../helpers/positions';
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
          // TODO: Show? Happens a lot in background, we need a good strategy
          console.error(result.error?.message);
        }
        const positions = result.success
          ? (result.data as Position[]).filter(
              (p) => p.collateral.amount > DUST_AMOUNT
            )
          : [];

        const totalDepositsUSD = getTotalSum(positions, 'collateral');
        const totalDebtUSD = getTotalSum(positions, 'debt');

        const totalAccrued = positions.reduce((acc, p) => {
          const accrueCollateral = getAccrual(
            p.collateral.amount * p.collateral.usdPrice,
            p.collateral.baseAPR,
            'collateral'
          );
          const accrueDebt = getAccrual(
            p.debt.amount * p.debt.usdPrice,
            p.debt.baseAPR,
            'debt'
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
    {
      enabled: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
      name: 'fuji-v2/positions',
    }
  )
);
