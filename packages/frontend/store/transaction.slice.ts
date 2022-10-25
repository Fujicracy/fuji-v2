import { Address, Token } from "@x-fuji/sdk"
import { formatUnits } from "ethers/lib/utils"
import { StateCreator } from "zustand"
import { useStore } from "."
import { sdk } from "./auth.slice"
// import { computed } from "zustand-middleware-computed-state"

type TransactionSlice = StateCreator<TransactionStore, [], [], TransactionStore>
export type TransactionStore = TransactionState & TransactionActions
type TransactionState = {
  transactionStatus: boolean
  showTransactionAbstract: boolean

  collateral: {
    value: number // Input value
    token: Token
    balance: number
    tokenValue: number // Value of token in usd
    tokens: Token[]
    balances: number[] | undefined // Balance of all collateral tokens
    chainId: ChainId // Hex value
  }

  borrow: {
    value: number // Input value
    token: Token
    balance: number
    tokenValue: number // Value of token in usd
    tokens: Token[]
    balances: number[] | undefined // Balance of all borrow tokens
    chainId: ChainId // Hex value
  }
}
type TransactionActions = {
  setTransactionStatus: (newStatus: boolean) => void
  setShowTransactionAbstract: (show: boolean) => void
  changeBorrowChain: (chainId: ChainId, walletAddress?: string) => void
  changeBorrowToken: (token: Token) => void
  changeBorrowValue: (val: string) => void
  changeCollateralChain: (chainId: ChainId, walletAddress?: string) => void
  changeCollateralToken: (token: Token) => void
  changeCollateralValue: (val: string) => void
  updateTokenPrice: (type: "borrow" | "collateral") => void
}
type ChainId = string // hex value as string

const initialChainId = "0x1"
const initialBorrowTokens = sdk.getDebtForChain(parseInt(initialChainId, 16))
const initialCollateralTokens = sdk.getCollateralForChain(
  parseInt(initialChainId, 16)
)

const initialState: TransactionState = {
  transactionStatus: false,
  showTransactionAbstract: false,

  collateral: {
    value: 0,
    balance: 0,
    token: initialCollateralTokens[0],
    tokenValue: 0,
    tokens: initialCollateralTokens,
    balances: undefined,
    chainId: initialChainId,
  },

  borrow: {
    value: 0,
    balance: 0,
    token: initialBorrowTokens[0],
    tokenValue: 0,
    tokens: initialBorrowTokens,
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

  async changeCollateralChain(chainId, walletAddress?) {
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
        balance: balances ? balances[0] : 0,
        tokens,
        balances,
        chainId,
      },
    })

    get().updateTokenPrice("collateral")
  },

  changeCollateralToken(token) {
    const collateral = get().collateral
    const balance = getBalance(token, collateral)

    set({ collateral: { ...collateral, token, balance } })
    get().updateTokenPrice("collateral")
  },

  async updateTokenPrice(type) {
    if (type === "borrow") {
      const tokenValue = await get().borrow.token.getPriceUSD()

      set({ borrow: { ...get().borrow, tokenValue } })
      console.log("borrow tokenValue = ", tokenValue)
    } else if (type === "collateral") {
      const tokenValue = await get().collateral.token.getPriceUSD()

      set({ collateral: { ...get().collateral, tokenValue } })
      console.log("collateral tokenValue = ", tokenValue)
    }
  },

  // TODO: Changeborrowchain and changecollateral chain are almost the same, refactor ?
  async changeBorrowChain(chainId, walletAddress?) {
    const tokens = sdk.getDebtForChain(parseInt(chainId, 16))
    const [token] = tokens

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

    set({ borrow: { ...get().borrow, token, tokens, balances, chainId } })
    get().updateTokenPrice("borrow")
  },

  changeBorrowToken(token) {
    set({ borrow: { ...get().borrow, token } })
    get().updateTokenPrice("borrow")
  },

  changeBorrowValue(val) {
    const value = parseFloat(val)
    set({ borrow: { ...get().borrow, value } })
  },

  changeCollateralValue(val) {
    const value = parseFloat(val)
    set({ collateral: { ...get().collateral, value } })
  },
})

/**
 *  Utils
 */

//  TODO: may be used with collateral or borrow as long as it is the same type
function getBalance(token: Token, collateral: TransactionState["collateral"]) {
  if (collateral.balances) {
    const tokenIndex = collateral.tokens.findIndex(
      (t) => t.symbol === token.symbol
    )
    return collateral.balances[tokenIndex]
  }
  return 0
}

// Workaround to compute property. See https://github.com/pmndrs/zustand/discussions/1341
// Better refacto using zustand-middleware-computed-state but it creates typing probleme idk how to solve
export function useLtv(): number {
  const collateralValue = useStore((state) => state.collateral.value)
  const collateralUsdValue = useStore((state) => state.collateral.tokenValue)
  const collateral = collateralValue * collateralUsdValue
  const borrowValue = useStore((state) => state.borrow.value)
  const borrowUsdValue = useStore((state) => state.borrow.tokenValue)
  const borrow = borrowValue * borrowUsdValue

  if (!collateral || !borrow) {
    return 0
  }
  return Math.round((borrow / collateral) * 100)
}
