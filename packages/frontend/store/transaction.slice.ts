import { Address, Token } from "@x-fuji/sdk"
import { formatUnits } from "ethers/lib/utils"
import produce from "immer"
import { StateCreator } from "zustand"
import invariant from "tiny-invariant"
import { debounce } from "debounce"
import { BigNumber } from "ethers"
import { useStore } from "."
import { sdk } from "./auth.slice"
import { Position } from "./Position"
import { DEFAULT_LTV_MAX, DEFAULT_LTV_TRESHOLD } from "../consts/borrow"

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

  transactionMeta: {
    status: "initial" | "fetching" | "ready" | "error" // TODO: What if error ?
    gasFees: number
    bridgeFees: number
    estimateTime: number
  }
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
  updateVault: () => void
  updateTransactionMeta: () => void
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
    ltv: 0,
    ltvMax: DEFAULT_LTV_MAX,
    ltvThreshold: DEFAULT_LTV_TRESHOLD,
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

  transactionMeta: {
    status: "initial",
    bridgeFees: 0,
    gasFees: 0,
    estimateTime: 0,
  },
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
    get().updateVault()
    get().updateTransactionMeta()
  },

  changeCollateralToken(token) {
    set(
      produce((state: TransactionState) => {
        state.position.collateral.token = token
      })
    )
    get().updateTokenPrice("collateral")
    get().updateAllowance()
    get().updateVault()
    get().updateTransactionMeta()
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
    get().updateVault()
    get().updateTransactionMeta()
  },

  changeBorrowToken(token) {
    set(
      produce((state: TransactionState) => {
        state.position.debt.token = token
      })
    )
    get().updateTokenPrice("debt")
    get().updateVault()
    get().updateTransactionMeta()
  },

  changeBorrowValue(value) {
    set(
      produce((state: TransactionState) => {
        state.debtInput = value
        state.position.debt.amount = value ? parseFloat(value) : 0
      })
    )
    get().updateTransactionMeta()
  },

  changeCollateralValue(value) {
    set(
      produce((state: TransactionState) => {
        state.collateralInput = value
        state.position.collateral.amount = value ? parseFloat(value) : 0
      })
    )
    get().updateTransactionMeta()
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

  async updateVault() {
    const address = useStore.getState().address
    if (!address) {
      return
    }
    const collateral = get().position.collateral.token
    const debt = get().position.debt.token

    const [vault] = await sdk.getBorrowingVaultsFor(collateral, debt)
    if (!vault) {
      // TODO: No vault = error, how to handle that in fe. Waiting for more informations from boyan
      return
    }

    const providers = await vault.getProviders()
    const ltvMax = vault.maxLtv ? vault.maxLtv.toNumber() : DEFAULT_LTV_MAX

    await vault.preLoad(address ? new Address(address) : undefined)

    set(
      produce((state: TransactionState) => {
        state.position.vault = vault
        state.position.ltvMax = ltvMax
        state.position.ltvThreshold = vault.liqRatio?.toNumber() || 0
        state.position.providers = providers
        state.position.activeProvider = providers[0]
      })
    )
  },

  updateTransactionMeta: debounce(async () => {
    const address = useStore.getState().address
    if (!address) {
      return
    }

    const position = get().position
    const { collateral, debt, vault } = position
    if (!vault || !collateral.amount || !debt.amount) {
      set(
        produce((state: TransactionState) => {
          state.transactionMeta.status = "error"
        })
      )
      return
    }

    set(
      produce((state: TransactionState) => {
        state.transactionMeta.status = "fetching"
      })
    )

    try {
      const { bridgeFee, estimateTime } = await sdk.previewDepositAndBorrow(
        vault,
        BigNumber.from(collateral.amount),
        BigNumber.from(debt.amount),
        collateral.token,
        debt.token,
        new Address(address)
      )
      set(
        produce((state: TransactionState) => {
          state.transactionMeta.status = "ready"
          state.transactionMeta.bridgeFees = bridgeFee.toNumber()
          state.transactionMeta.estimateTime = estimateTime
        })
      )
    } catch (e) {
      set(
        produce((state: TransactionState) => {
          state.transactionMeta.status = "error"
        })
      )
    }
  }, 500),
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
