import { Address, Token } from "@x-fuji/sdk"
import { formatUnits } from "ethers/lib/utils"
import produce from "immer"
import { StateCreator } from "zustand"
import { useStore } from "."
import { sdk } from "./auth.slice"
import { Position } from "./Position"

type TransactionSlice = StateCreator<TransactionStore, [], [], TransactionStore>
export type TransactionStore = TransactionState & TransactionActions
type TransactionState = {
  transactionStatus: boolean
  showTransactionAbstract: boolean

  position: Position

  collateralTokens: Token[]
  collateralBalances: Record<string, number>
  collateralAllowance?: number
  collateralInput: string
  collateralChainId: ChainId

  debtTokens: Token[]
  debtBalances: Record<string, number>
  debtAllowance: number
  debtInput: string
  debtChainId: ChainId
}

type TransactionActions = {
  setTransactionStatus: (newStatus: boolean) => void
  setShowTransactionAbstract: (show: boolean) => void
  changeBorrowChain: (chainId: ChainId) => void
  changeBorrowToken: (token: Token) => void
  changeBorrowValue: (val: string) => void
  changeCollateralChain: (chainId: ChainId) => void
  changeCollateralToken: (token: Token) => void
  changeCollateralValue: (val: string) => void
  updateTokenPrice: (type: "debt" | "collateral") => void
  updateBalances: (type: "debt" | "collateral") => void
  updateAllowance: () => void
}
type ChainId = string // hex value as string

const initialChainId = "0x1"
const initialDebtTokens = sdk.getDebtForChain(parseInt(initialChainId, 16))
const initialCollateralTokens = sdk.getCollateralForChain(
  parseInt(initialChainId, 16)
)

const initialState: TransactionState = {
  transactionStatus: false,
  showTransactionAbstract: false,

  position: {
    collateral: {
      amount: 0,
      token: initialCollateralTokens[0],
      usdValue: 0,
    },
    debt: {
      amount: 0,
      token: initialDebtTokens[0],
      usdValue: 0,
    },
  },

  collateralTokens: initialCollateralTokens,
  collateralBalances: {},
  collateralInput: "",
  collateralChainId: initialChainId,

  debtTokens: initialDebtTokens,
  debtBalances: {},
  debtAllowance: 0,
  debtInput: "",
  debtChainId: initialChainId,
}

export const createTransactionSlice: TransactionSlice = (set, get) => ({
  ...initialState,

  setTransactionStatus: (transactionStatus: boolean) => {
    set({ transactionStatus })
  },

  setShowTransactionAbstract: (showTransactionAbstract: boolean) => {
    set({ showTransactionAbstract })
  },

  async changeCollateralChain(chainId) {
    const tokens = sdk.getCollateralForChain(parseInt(chainId, 16))

    set(
      produce((state: TransactionState) => {
        state.collateralChainId = chainId
        state.collateralTokens = tokens
        state.position.collateral.token = tokens[0]
      })
    )
    get().updateTokenPrice("collateral")
    get().updateBalances("collateral")
  },

  changeCollateralToken(token) {
    set(
      produce((state: TransactionState) => {
        state.position.collateral.token = token
      })
    )
    get().updateTokenPrice("collateral")
    get().updateAllowance()
  },

  async changeBorrowChain(chainId) {
    const tokens = sdk.getDebtForChain(parseInt(chainId, 16))

    set(
      produce((state: TransactionState) => {
        state.debtChainId = chainId
        state.debtTokens = tokens
        state.position.debt.token = tokens[0]
      })
    )

    get().updateTokenPrice("debt")
    get().updateBalances("debt")
  },

  changeBorrowToken(token) {
    set(
      produce((state: TransactionState) => {
        state.position.debt.token = token
      })
    )
    get().updateTokenPrice("debt")
  },

  changeBorrowValue(value) {
    set(
      produce((state: TransactionState) => {
        state.debtInput = value
        state.position.debt.amount = value ? parseFloat(value) : 0
      })
    )
  },

  changeCollateralValue(value) {
    set(
      produce((state: TransactionState) => {
        state.collateralInput = value
        state.position.collateral.amount = value ? parseFloat(value) : 0
      })
    )
  },

  async updateBalances(type) {
    const address = useStore.getState().address
    const tokens = type === "debt" ? get().debtTokens : get().collateralTokens
    const token =
      type === "debt"
        ? get().position.debt.token
        : get().position.collateral.token
    const chainId = token.chainId

    if (!address) {
      return
    }

    const rawBalances = await sdk.getTokenBalancesFor(
      tokens,
      new Address(address),
      chainId
    )
    const balances: Record<string, number> = {}
    rawBalances.forEach((b, i) => {
      const value = parseFloat(formatUnits(b, tokens[i].decimals))
      balances[tokens[i].symbol] = value
    })

    set(
      produce((state: TransactionState) => {
        if (type === "debt") {
          state.debtBalances = balances
        } else if (type === "collateral") {
          state.collateralBalances = balances
        }
      })
    )
  },

  async updateTokenPrice(type) {
    const tokenValue = await get().position[type].token.getPriceUSD()

    set(
      produce((state: TransactionState) => {
        state.position[type].usdValue = tokenValue
      })
    )
  },

  async updateAllowance() {
    const token = get().position.collateral.token
    const address = useStore.getState().address as string

    if (!address) {
      return
    }

    const res = await sdk.getAllowanceFor(token, new Address(address))
    const allowance = res.toNumber()

    set({ collateralAllowance: allowance })
  },
})

// Workaround to compute property. See https://github.com/pmndrs/zustand/discussions/1341
// Better refacto using zustand-middleware-computed-state but it creates typing probleme idk how to solve
export function useLtv(): number {
  const collateralValue = useStore((state) => parseFloat(state.collateralInput))
  const collateralUsdValue = useStore(
    (state) => state.position.collateral.usdValue
  )
  const collateral = collateralValue * collateralUsdValue

  const debtValue = useStore((state) => parseFloat(state.debtInput))
  const debtUsdValue = useStore((state) => state.position.debt.usdValue)
  const debt = debtValue * debtUsdValue

  if (!collateral || !debt) {
    return 0
  }
  return Math.round((debt / collateral) * 100)
}

export function useLiquidationPrice(liquidationTreshold: number): {
  liquidationPrice: number
  liquidationDiff: number
} {
  const collateralAmount = useStore((state) => state.position.collateral.amount)
  const collateralUsdValue = useStore(
    (state) => state.position.collateral.usdValue
  )

  const debtValue = useStore((state) => parseFloat(state.debtInput))
  const debtUsdValue = useStore((state) => state.position.debt.usdValue)
  const debt = debtValue * debtUsdValue

  if (!debt || !collateralAmount) {
    return { liquidationPrice: 0, liquidationDiff: 0 }
  }

  const liquidationPrice =
    debt / (collateralAmount * (liquidationTreshold / 100))
  const liquidationDiff = Math.round(
    (1 - liquidationPrice / collateralUsdValue) * 100
  )

  return { liquidationPrice, liquidationDiff }
}

// TODO: this hook is quite expensive in terms of resources (2 api call), so better debounce before calling it.
export async function useCost() {
  const collateralToken = useStore((state) => state.position.collateral.token)
  // const collateralChain = useStore((state) => state.collateral.chainId)
  // const collateralValue = useStore((state) => state.collateral.value)
  const borrowToken = useStore((state) => state.position.debt.token)
  const debtChain = useStore((state) => state.position.debt.token.chainId)
  const debtValue = useStore((state) => state.debtInput)
  const address = useStore((state) => state.address)

  // const cost = useMemo(async () => {
  if (!debtValue || !debtChain || !address) {
    return 0
  }
  // TODO: It seems like getBorrowing vault always return undefined
  // but it should never happen cause we use `getDebtForChain` and `getCollateralForChain`
  // and select only available tokens from there.
  const vault = await sdk.getBorrowingVaultFor(collateralToken, borrowToken)
  console.log({ vault })

  // TODO: Can't rn because the function is not properly implemented (wrong typing)
  // const { cost } = await vault.previewDepositAndBorrow(
  //   BigNumber.from(collateralValue),
  //   BigNumber.from(borrowValue),
  //   parseInt(collateralChain),
  //   new Address(address)
  // )
  // return cost
  // }, [collateralChain, collateralValue, borrowChain, borrowValue])
  return 0
}
