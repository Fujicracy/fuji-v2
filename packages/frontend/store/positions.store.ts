import { sdk } from "../services/sdk"
import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { Position } from "./models/Position"
import { useAuth } from "./auth.store"
import { Address, Token } from "@x-fuji/sdk"
import { BigNumberish, ethers } from "ethers"

type PositionsState = {
  totalDepositsUSD: number | undefined
  totalDebtUSD: number | undefined
  totalAPY: number | undefined
  availableBorrowPowerUSD: number | undefined
  positions: Position[]
  // positionsAtRisk?: Position[]
}

type PositionsActions = {
  fetchUserPositions: () => void
  // getPositionsAtRisk: () => void
}

const initialState: PositionsState = {
  totalDepositsUSD: undefined,
  totalDebtUSD: undefined,
  totalAPY: undefined,
  availableBorrowPowerUSD: undefined,
  positions: [],
  // positionsAtRisk: [],
}

export type PositionsStore = PositionsState & PositionsActions

export const usePositions = create<PositionsStore>()(
  // devtools(
  (set, get) => ({
    ...initialState,

    fetchUserPositions: async () => {
      const account = useAuth.getState().address
      const positions = await getPositionsWithBalance(account)

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
      })
    },

    // getPositionsAtRisk: async () => {
    //   set({ positionsAtRisk: /*fetchAndComputeTotalAPY()*/ [] })
    // },
  })
  // {
  //   enabled: process.env.NEXT_PUBLIC_APP_ENV !== "production",
  //   name: "fuji-v2/positions",
  // }
  // )
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
  return positions.reduce((s, p) => p[param].usdValue + s, 0)
}

async function getPositionsWithBalance(account_: string | undefined) {
  if (account_) {
    const account = new Address(account_)
    const allVaults = await sdk.getAllAccountDetailsPerVaultFor(account)
    const vaultsWithBalance = allVaults.filter((v) =>
      v.depositBalance.gt(ethers.BigNumber.from("0"))
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
        p.debt.usdValue == 0
          ? 0
          : p.debt.usdValue / (p.ltvThreshold * p.collateral.amount)
      p.liquidationDiff =
        p.liquidationPrice == 0
          ? 0
          : bigToFloat(v.debtPriceUSD, v.vault.debt.decimals) -
            p.liquidationPrice
      return p
    })
    return vaults || []
  } else {
    return []
  }
}

export function getAccrual(
  balance: number,
  baseAPR: number | undefined,
  param: "collateral" | "debt"
): number {
  const factor = param == "debt" ? -1 : 1
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
