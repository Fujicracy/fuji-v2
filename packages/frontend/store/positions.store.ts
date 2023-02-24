import { sdk } from "../services/sdk"
import { create } from "zustand"
import { Position } from "./models/Position"
import { useAuth } from "./auth.store"
import { Address } from "@x-fuji/sdk"
import { BigNumberish, BigNumber } from "ethers"
import { formatUnits, parseUnits } from "ethers/lib/utils"
import { devtools } from "zustand/middleware"

type PositionsState = {
  positions: Position[]
  totalDepositsUSD?: number
  totalDebtUSD?: number
  totalAPY?: number
  availableBorrowPowerUSD?: number
  loading: boolean
  // positionsAtRisk?: Position[]
}

type PositionsActions = {
  fetchUserPositions: () => void
  // getPositionsAtRisk: () => void
}

const initialState: PositionsState = {
  positions: [],
  loading: false,
  // positionsAtRisk: [],
}

export type PositionsStore = PositionsState & PositionsActions

export const usePositions = create<PositionsStore>()(
  devtools(
    (set) => ({
      ...initialState,

      fetchUserPositions: async () => {
        set({ loading: true })
        const addr = useAuth.getState().address
        const positions = await getPositionsWithBalance(addr)

        const totalDepositsUSD = getTotalSum(positions, "collateral")
        const totalDebtUSD = getTotalSum(positions, "debt")

        const totalAccrued = positions.reduce((acc, p) => {
          const accrueCollateral = getAccrual(
            p.collateral.usdValue,
            p.collateral.baseAPR,
            "collateral"
          )
          const accrueDebt = getAccrual(p.debt.usdValue, p.debt.baseAPR, "debt")
          return accrueCollateral + accrueDebt + acc
        }, 0)
        // `totalAPY` is scaled up by 100 to express in percentage %.
        const totalAPY = totalDepositsUSD
          ? (totalAccrued * 100) / totalDepositsUSD
          : 0

        const availableBorrowPowerUSD =
          getCurrentAvailableBorrowingPower(positions)

        set({
          positions,
          totalDepositsUSD,
          totalDebtUSD,
          totalAPY: parseFloat(totalAPY.toFixed(2)),
          availableBorrowPowerUSD,
          loading: false,
        })
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
  const value = big ?? parseUnits("0", 18)
  return parseFloat(formatUnits(value, decimals))
}

function getTotalSum(
  positions: Position[],
  param: "collateral" | "debt"
): number {
  return positions.reduce((s, p) => p[param].usdValue + s, 0)
}

async function getPositionsWithBalance(addr?: string): Promise<Position[]> {
  if (!addr) return []

  const account = Address.from(addr)
  const allVaults = await sdk.getBorrowingVaultsFinancials(account)
  const vaultsWithBalance = allVaults.filter((v) =>
    v.depositBalance.gt(BigNumber.from("0"))
  )

  const vaults = vaultsWithBalance.map((v) => {
    const p = {} as Position
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
        return v.activeProvider.depositAprBase
      },
    }
    p.debt = {
      amount: bigToFloat(v.borrowBalance, v.vault.debt.decimals),
      token: v.vault.debt,
      get usdValue() {
        return this.amount * bigToFloat(v.debtPriceUSD, v.vault.debt.decimals)
      },
      get baseAPR() {
        return v.activeProvider.borrowAprBase
      },
    }
    p.ltv = p.debt.usdValue / p.collateral.usdValue
    p.ltvMax = bigToFloat(v.vault.maxLtv, 18)
    p.ltvThreshold = bigToFloat(v.vault.liqRatio, 18)
    p.liquidationPrice =
      p.debt.usdValue === 0
        ? 0
        : p.debt.usdValue / (p.ltvThreshold * p.collateral.amount)
    p.liquidationDiff =
      p.liquidationPrice === 0
        ? 0
        : bigToFloat(v.debtPriceUSD, v.vault.debt.decimals) - p.liquidationPrice
    return p
  })

  return vaults
}

export function getAccrual(
  balance: number,
  baseAPR: number | undefined,
  param: "collateral" | "debt"
): number {
  const factor = param === "debt" ? -1 : 1
  // `baseAPR` returned bu SDK is formated in %, therefore to get decimal we divide by 100.
  const aprDecimal = baseAPR ? baseAPR / 100 : 0
  // Blockchain APR compounds per block, and daily compounding is a close estimation for APY
  const apyDecimal = (1 + aprDecimal / 365) ** 365 - 1
  return factor * balance * apyDecimal
}

function getCurrentAvailableBorrowingPower(positions: Position[]): number {
  return positions.reduce((b, pos) => {
    return pos.collateral.usdValue * pos.ltvMax - pos.debt.usdValue + b
  }, 0)
}
