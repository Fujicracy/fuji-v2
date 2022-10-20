import { Address, Token } from "@x-fuji/sdk"
import { StateCreator } from "zustand"
import { sdk } from "./auth.slice"

type TransactionSlice = StateCreator<TransactionStore, [], [], TransactionStore>
export type TransactionStore = TransactionState & TransactionActions
type TransactionState = {
  transactionStatus: boolean
  showTransactionAbstract: boolean

  collateral: {
    value: number // Input value
    token: Token | null
    balance: number
    tokens: Token[]
    balances: number[] // Balance of all collateral tokens
    chainId: ChainId | null // Hex value
  }

  borrow: {
    value: number // Input value
    token: Token | null
    tokens: Token[]
    chainId: ChainId | null // Hex value
  }
}
type TransactionActions = {
  setTransactionStatus: (newStatus: boolean) => void
  setShowTransactionAbstract: (show: boolean) => void
  changeBorrowChain: (chainId: ChainId) => void
  changeCollateralChain: (chainId: ChainId, address: string) => void
}
type ChainId = string // hex value as string

const initialState: TransactionState = {
  transactionStatus: false,
  showTransactionAbstract: false,

  collateral: {
    value: 0,
    balance: 0,
    token: null,
    tokens: [],
    balances: [],
    chainId: null,
  },

  borrow: {
    value: 0,
    token: null,
    tokens: [],
    chainId: null,
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

  async changeCollateralChain(chainId: string, address: string) {
    const tokens = sdk.getCollateralForChain(parseInt(chainId, 16))
    const rawBalances = await sdk.getTokenBalancesFor(
      tokens,
      new Address(address),
      parseInt(chainId, 16)
    )
    const balances = rawBalances.map((b) => parseInt(b.toString()))
    debugger

    set({
      collateral: {
        ...get().collateral,
        tokens,
        balances,
        chainId,
      },
    })
  },

  async changeBorrowChain(chainId: string) {
    const tokens = sdk.getCollateralForChain(parseInt(chainId, 16))

    set({
      borrow: {
        ...get().borrow,
        tokens,
        chainId,
      },
    })
  },
})
