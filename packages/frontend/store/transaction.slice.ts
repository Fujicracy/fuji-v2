import { Address, Token } from "@x-fuji/sdk"
import { formatUnits } from "ethers/lib/utils"
import { StateCreator } from "zustand"
import { sdk } from "./auth.slice"

type TransactionSlice = StateCreator<TransactionStore, [], [], TransactionStore>
export type TransactionStore = TransactionState & TransactionActions
type TransactionState = {
  transactionStatus: boolean
  showTransactionAbstract: boolean

  collateral: {
    value: number // Input value
    token: Token
    balance: number
    tokens: Token[]
    balances: number[] | undefined // Balance of all collateral tokens
    chainId: ChainId // Hex value
  }

  borrow: {
    value: number // Input value
    token: Token
    balance: number
    tokens: Token[]
    balances: number[] | undefined // Balance of all borrow tokens
    chainId: ChainId // Hex value
  }
}
type TransactionActions = {
  setTransactionStatus: (newStatus: boolean) => void
  setShowTransactionAbstract: (show: boolean) => void
  changeBorrowChain: (chainId: ChainId, walletAddress?: string) => void
  changeCollateralChain: (chainId: ChainId, walletAddress?: string) => void
  changeCollateralToken: (token: Token) => void
  changeBorrowToken: (token: Token) => void
}
type ChainId = string // hex value as string

const initialChainId = "0x1"
const initialTokens = sdk.getCollateralForChain(parseInt(initialChainId, 16))

const initialState: TransactionState = {
  transactionStatus: false,
  showTransactionAbstract: false,

  collateral: {
    value: 0,
    balance: 0,
    token: initialTokens[0],
    tokens: initialTokens,
    balances: undefined,
    chainId: initialChainId,
  },

  borrow: {
    value: 0,
    balance: 0,
    token: initialTokens[0],
    tokens: initialTokens,
    balances: undefined,
    chainId: initialChainId,
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

  async changeCollateralChain(chainId: string, walletAddress?: string) {
    const tokens = sdk.getCollateralForChain(parseInt(chainId, 16))

    let balances
    if (walletAddress) {
      const rawBalances = await sdk.getTokenBalancesFor(
        tokens,
        new Address(walletAddress),
        parseInt(chainId, 16)
      )
      balances = rawBalances.map((b, i) => {
        const res = formatUnits(b, tokens[i].decimals)
        return parseFloat(res)
      })
    } else {
      balances = undefined
    }

    set({
      collateral: {
        ...get().collateral,
        token: tokens[0],
        tokens,
        balances,
        chainId,
      },
    })
  },

  changeCollateralToken(token: Token) {
    set({
      collateral: {
        ...get().collateral,
        token,
      },
    })
  },

  // TODO: Changeborrowchain and changecollateral chain are almost the same, refactor ?
  async changeBorrowChain(chainId: string, walletAddress?: string) {
    const tokens = sdk.getCollateralForChain(parseInt(chainId, 16))

    let balances
    if (walletAddress) {
      const rawBalances = await sdk.getTokenBalancesFor(
        tokens,
        new Address(walletAddress),
        parseInt(chainId, 16)
      )
      balances = rawBalances.map((b, i) => {
        const res = formatUnits(b, tokens[i].decimals)
        return parseFloat(res)
      })
    } else {
      balances = undefined
    }

    set({
      borrow: {
        ...get().borrow,
        token: tokens[0],
        tokens,
        balances,
        chainId,
      },
    })
  },

  changeBorrowToken(token: Token) {
    set({
      borrow: {
        ...get().borrow,
        token,
      },
    })
  },
})
