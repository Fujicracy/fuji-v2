import { sdk } from "../services/sdk"
import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { Position } from "./models/Position.d.ts"
import { useAuth } from "./auth.store"
import { Address } from "@x-fuji/sdk"
import { BigNumberish, ethers } from "ethers"

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
        const account = useAuth.getState().address
        console.log(`position store- account ${account || "-"}`)
        const fetched = await getPositionsWithBalance(account)
        set({ positions: fetched })
      },

      getTotalDepositUSD: async () => {
        const positions_ = get().positions
        const totalSum = getTotalSum(positions_, "collateral")
        set({ totalDepositsUSD: parseFloat(totalSum.toFixed(2)) })
      },

      getTotalDebtUSD: async () => {
        const positions_ = get().positions
        const totalSum = getTotalSum(positions_, "debt")
        set({ totalDebtUSD: parseFloat(totalSum.toFixed(2)) })
      },

      getTotalAPY: async () => {
        const positions_ = get().positions
        const totalAccrued = positions_.reduce((acc, p) => {
          const accrueCollateral = getAccrual(
            p.collateral.usdValue,
            p.collateral.baseAPR,
            "collateral"
          )
          const accrueDebt = getAccrual(p.debt.usdValue, p.debt.baseAPR, "debt")
          return accrueCollateral + accrueDebt + acc
        }, 0)
        const totalDeposits_ = get().totalDepositsUSD
        const totalAPY_ = totalDeposits_
          ? (totalAccrued * 100) / totalDeposits_
          : 0
        set({ totalAPY: parseFloat(totalAPY_.toFixed(2)) })
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

function bigToFloat(
  big: BigNumberish | undefined,
  decimals: number | BigNumberish
): number {
  const big_ = big ? big : ethers.utils.parseUnits("0", 18)
  return parseFloat(ethers.utils.formatUnits(big_, decimals))
}

function getTotalSum(
  positions: Position[],
  param: "collateral" | "debt"
): number {
  return positions.reduce((acc, p) => p[param].usdValue + acc, 0)
}

async function getPositionsWithBalance(account_: string | undefined) {
  if (account_) {
    const account = new Address(account_)
    const allVaults = await sdk.getAllAccountDetailsPerVaultFor(account)
    const vaultsWithBalance = allVaults.filter((v) =>
      v.depositBalance.gt(ethers.BigNumber.from("0"))
    )
    return vaultsWithBalance.map((v) => {
      const p = new Position()
      p.vault = v.vault
      p.collateral = {
        amount: bigToFloat(v.depositBalance, v.vault.collateral.decimals),
        token: v.vault.collateral,
        get usdValue() {
          return (
            this.amount *
            bigToFloat(v.collateralPriceUSD, v.vault.collateral.decimals)
          )
        },
        get baseAPR() {
          return v.depositAprBase
        },
      }
      p.debt = {
        amount: bigToFloat(v.borrowBalance, v.vault.debt.decimals),
        token: v.vault.debt,
        get usdValue() {
          return this.amount * bigToFloat(v.debtPriceUSD, v.vault.debt.decimals)
        },
        get baseAPR() {
          return v.borrowAprBase
        },
      }
      p.ltv = p.debt.usdValue / p.collateral.usdValue
      p.ltvMax = bigToFloat(v.vault.maxLtv, 18)
      p.ltvThreshold = bigToFloat(v.vault.liqRatio, 18)
      p.liquidationPrice =
        p.debt.usdValue / (p.ltvThreshold * p.collateral.amount)
      p.liquidationDiff =
        bigToFloat(v.debtPriceUSD, v.vault.debt.decimals) - p.liquidationPrice
      return p
    })
  } else {
    return []
  }
}

function getAccrual(
  balance: number,
  baseAPR: number | undefined,
  param: "collateral" | "debt"
): number {
  const factor = param == "debt" ? -1 : 1
  const aprDecimal = baseAPR ? baseAPR / 100 : 0
  // Blockchain APR compounds per block, and daily compounding is a close estimation for APY
  const apy = (1 + aprDecimal / 365) ^ (365 - 1)
  return factor * balance * (apy + 1)
}
