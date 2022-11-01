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
    // TODO: use input as string for handling inputs and value as computed prop in number to avoid too many conversion in templates
    value: string // Input value using string to handle X.000X numbers (otherwise rounded to X during conversion)
    token: Token
    balance: number
    allowance: number
    tokenValue: number // Value of token in usd
    tokens: Token[]
    balances: number[] | undefined // Balance of all collateral tokens
    chainId: ChainId // Hex value
  }

  borrow: {
    value: string
    token: Token
    balance: number
    tokenValue: number
    tokens: Token[]
    balances: number[] | undefined
    chainId: ChainId
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
  updateTokenPrice: (type: "borrow" | "collateral") => void
  updateBalances: (type: "borrow" | "collateral") => void
  updateAllowance: () => void
}
type ChainId = string // hex value as string

const initialChainId = "0x1"
const initialBorrowTokens = sdk.getDebtForChain(parseInt(initialChainId, 16))
const initialCollateralTokens = sdk.getCollateralForChain(
  parseInt(initialChainId, 16)
)
// TODO: initial balance
// TODO: initial allowance

const initialState: TransactionState = {
  transactionStatus: false,
  showTransactionAbstract: false,

  collateral: {
    value: "0",
    balance: 0,
    allowance: 0,
    token: initialCollateralTokens[0],
    tokenValue: 0,
    tokens: initialCollateralTokens,
    balances: initialCollateralTokens.map((_) => 0),
    chainId: initialChainId,
  },

  borrow: {
    value: "0",
    balance: 0,
    token: initialBorrowTokens[0],
    tokenValue: 0,
    tokens: initialBorrowTokens,
    balances: initialBorrowTokens.map((_) => 0),
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

  async changeCollateralChain(chainId) {
    const tokens = sdk.getCollateralForChain(parseInt(chainId, 16))

    set({
      collateral: {
        ...get().collateral,
        token: tokens[0],
        tokens,
        chainId,
      },
    })
    get().updateTokenPrice("collateral")
    get().updateBalances("collateral")
  },

  changeCollateralToken(token) {
    const collateral = get().collateral
    const balance = getBalance(token, collateral)

    set({ collateral: { ...collateral, token, balance } })
    get().updateTokenPrice("collateral")
    get().updateAllowance()
  },

  async changeBorrowChain(chainId) {
    const tokens = sdk.getDebtForChain(parseInt(chainId, 16))
    const [token] = tokens

    set({ borrow: { ...get().borrow, token, tokens, chainId } })

    get().updateTokenPrice("borrow")
    get().updateBalances("borrow")
  },

  changeBorrowToken(token) {
    set({ borrow: { ...get().borrow, token } })
    get().updateTokenPrice("borrow")
  },

  changeBorrowValue(value) {
    set({ borrow: { ...get().borrow, value } })
  },

  changeCollateralValue(value) {
    set({ collateral: { ...get().collateral, value } })
  },

  async updateBalances(type) {
    const address = useStore.getState().address
    const { tokens, token, chainId } = useStore.getState()[type]

    if (!address) {
      return
    }

    const rawBalances = await sdk.getTokenBalancesFor(
      tokens,
      new Address(address),
      parseInt(chainId, 16)
    )
    const balances = rawBalances.map((b, i) => {
      const res = formatUnits(b, tokens[i].decimals)
      return parseFloat(res)
    })

    const tIdx = tokens.findIndex((t) => t.symbol === token.symbol)
    const balance = balances[tIdx]

    set({ [type]: { ...get()[type], balances, balance } })
  },

  async updateTokenPrice(type) {
    const tokenValue = await get()[type].token.getPriceUSD()
    set({ [type]: { ...get()[type], tokenValue } })
  },

  async updateAllowance() {
    const token = get().collateral.token
    const address = useStore.getState().address as string

    if (!address) {
      return
    }

    const res = await sdk.getAllowanceFor(token, new Address(address))
    const allowance = res.toNumber()
    set({ collateral: { ...get().collateral, allowance } })
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
  const collateralValue = useStore((state) =>
    parseFloat(state.collateral.value)
  )
  const collateralUsdValue = useStore((state) => state.collateral.tokenValue)
  const collateral = collateralValue * collateralUsdValue
  const borrowValue = useStore((state) => parseFloat(state.borrow.value))
  const borrowUsdValue = useStore((state) => state.borrow.tokenValue)
  const borrow = borrowValue * borrowUsdValue

  if (!collateral || !borrow) {
    return 0
  }
  return Math.round((borrow / collateral) * 100)
}

export function useLiquidationPrice(liquidationTreshold: number): {
  liquidationPrice: number
  liquidationDiff: number
} {
  const collateralValue = useStore((state) =>
    parseFloat(state.collateral.value)
  )
  const collateralUsdValue = useStore((state) => state.collateral.tokenValue)
  const borrowValue = useStore((state) => parseFloat(state.borrow.value))
  const borrowUsdValue = useStore((state) => state.borrow.tokenValue)
  const borrow = borrowValue * borrowUsdValue

  if (!borrow || !collateralValue) {
    return { liquidationPrice: 0, liquidationDiff: 0 }
  }

  const liquidationPrice =
    borrow / (collateralValue * (liquidationTreshold / 100))
  const liquidationDiff = Math.round(
    (1 - liquidationPrice / collateralUsdValue) * 100
  )

  return { liquidationPrice, liquidationDiff }
}

// TODO: this hook is quite expensive in terms of resources (2 api call), so better debounce before calling it.
export async function useCost() {
  const collateralToken = useStore((state) => state.collateral.token)
  // const collateralChain = useStore((state) => state.collateral.chainId)
  // const collateralValue = useStore((state) => state.collateral.value)
  const borrowToken = useStore((state) => state.borrow.token)
  const borrowChain = useStore((state) => state.borrow.chainId)
  const borrowValue = useStore((state) => state.borrow.value)
  const address = useStore((state) => state.address)

  // const cost = useMemo(async () => {
  if (!borrowValue || !borrowChain || !address) {
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
