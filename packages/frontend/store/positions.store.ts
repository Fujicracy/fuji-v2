import { sdk } from "../services/sdk"
import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { Position } from "./models/Position"
import { useAuth } from "./auth.store"

type PositionsState = {
  totalDepositsUSD: number | undefined
  totalDebtUSD: number | undefined
  totalAPY: number | undefined
  availableBorrowingPowerUSD: number | undefined
  positions: Position[]
  // positionsAtRisk?: Position[]
}

type PositionsActions = {
  fetchUserPositions: () => void
  getTotalDepositUSD: () => void
  getTotalDebtUSD: () => void
  getTotalAPY: () => void
  getTotalAvailableBorrowPowerUSD: () => void
  // getPositionsAtRisk: () => void
}

const initialState: PositionsState = {
  totalDepositsUSD: undefined,
  totalDebtUSD: undefined,
  totalAPY: undefined,
  availableBorrowingPowerUSD: undefined,
  positions: [],
  // positionsAtRisk: [],
}

export type PositionsStore = PositionsState & PositionsActions

export const usePositions = create<PositionsStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchUserPositions: async () => {
        // TODO something with the SDK
        const fetched: Position[] = []
        set({ positions: fetched })
      },

      getTotalDepositUSD: async () => {
        const positions_ = get().positions
        set({ totalDepositsUSD: getTotalSum(positions_, "collateral") })
      },

      getTotalDebtUSD: async () => {
        const positions_ = get().positions
        set({ totalDepositsUSD: getTotalSum(positions_, "debt") })
      },

      getTotalAPY: async () => {
        set({ totalAPY: /*fetchAndComputeTotalAPY()*/ 0 })
      },

      getTotalAvailableBorrowPowerUSD: async () => {
        set({ availableBorrowingPowerUSD: /*fetchAndComputeTotalAPY()*/ 0 })
      },

      // getPositionsAtRisk: async () => {
      //   set({ positionsAtRisk: /*fetchAndComputeTotalAPY()*/ [] })
      // },
    }),
    {
      enabled: process.env.NEXT_PUBLIC_APP_ENV !== "production",
      name: "fuji-v2/positions",
    }
  )
)

function getTotalSum(
  positions: Position[],
  param: "collateral" | "debt"
): number {
  return positions.reduce((acc, v) => v[param].usdValue + acc, 0)
}

async function fetchAndComputeTotalAPY() {
  return undefined
}
