import {
  Address,
  CONNEXT_ROUTER_ADDRESS,
  contracts,
  RouterActionParams,
  Sdk,
  Token,
} from "@x-fuji/sdk"
import { formatUnits, parseUnits } from "ethers/lib/utils"
import produce, { setAutoFreeze } from "immer"
import { StateCreator } from "zustand"
import { debounce } from "debounce"
import { useStore } from "."
import { sdk } from "./auth.slice"
import { Position } from "./Position"
import { DEFAULT_LTV_MAX, DEFAULT_LTV_TRESHOLD } from "../consts/borrow"
import { ethers, Signature } from "ethers"
setAutoFreeze(false)

type TransactionSlice = StateCreator<TransactionStore, [], [], TransactionStore>
export type TransactionStore = TransactionState & TransactionActions
type TransactionState = {
  transactionStatus: boolean
  showTransactionAbstract: boolean

  position: Position

  collateralTokens: Token[]
  collateralBalances: Record<string, number>
  collateralAllowance: {
    status: "initial" | "fetching" | "allowing" | "ready" | "error"
    value: number | undefined
  }
  collateralInput: string
  collateralChainId: ChainId

  debtTokens: Token[]
  debtBalances: Record<string, number>
  debtAllowance: number
  debtInput: string
  debtChainId: ChainId

  transactionMeta: {
    status: "initial" | "fetching" | "ready" | "error" // TODO: What if error ?
    gasFees: number // TODO: cannot estimat gas fees until the user has approved AND permit fuji to use its fund
    bridgeFees: number
    estimateTime: number
  }

  needPermit: boolean
  isSigning: boolean
  signature?: Signature
  actions?: RouterActionParams[]

  isBorrowing: boolean
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

  allow: (amount: number, callback: () => void) => void
  signPermit: () => void
  borrow: () => void
}
type ChainId = string // hex value as string

const initialChainId = "0x1a4"
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
  collateralAllowance: {
    status: "initial",
    value: undefined,
  },

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

  needPermit: true,
  isSigning: false,
  isBorrowing: false,
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
    get().updateAllowance()
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
    const token = get().position[type].token

    let tokenValue = await token.getPriceUSD()
    if (token.symbol === "WETH") {
      // TODO: remove (fix bc value on testnet is too low)
      tokenValue = 1242.42
    }
    console.log(token.symbol, "=>", tokenValue, "USD")

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

    set(
      produce((s: TransactionState) => {
        s.collateralAllowance.status = "fetching"
      })
    )
    try {
      const res = await sdk.getAllowanceFor(token, new Address(address))
      const value = parseFloat(ethers.utils.formatUnits(res, token.decimals))
      set({ collateralAllowance: { status: "ready", value } })
    } catch (e) {
      // TODO: how to handle the case where we can't fetch allowance ?
      console.error(e)
      set(
        produce((s: TransactionState) => {
          s.collateralAllowance.status = "error"
        })
      )
    }
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
    await vault.preLoad(address ? new Address(address) : undefined)

    const ltvMax = vault.maxLtv
      ? parseInt(ethers.utils.formatUnits(vault.maxLtv, 16))
      : DEFAULT_LTV_MAX
    const ltvThreshold = vault.liqRatio
      ? parseInt(ethers.utils.formatUnits(vault.liqRatio, 16))
      : DEFAULT_LTV_TRESHOLD

    set(
      produce((state: TransactionState) => {
        state.position.vault = vault
        state.position.ltvMax = ltvMax
        state.position.ltvThreshold = ltvThreshold
        state.position.providers = providers
        state.position.activeProvider = providers[0]
      })
    )
  },

  updateTransactionMeta: debounce(async () => {
    const address = useStore.getState().address
    const provider = useStore.getState().provider
    if (!address || !provider) {
      return
    }

    const position = get().position
    const { collateral, debt, vault } = position
    if (!vault || !collateral.amount || !debt.amount) {
      return set(
        produce((state: TransactionState) => {
          state.transactionMeta.status = "error"
        })
      )
    }

    set(
      produce((state: TransactionState) => {
        state.transactionMeta.status = "fetching"
        state.signature = undefined
        state.actions = undefined
      })
    )

    try {
      const { bridgeFee, estimateTime, actions } =
        await sdk.previewDepositAndBorrow(
          vault,
          parseUnits(collateral.amount.toString(), collateral.token.decimals),
          parseUnits(debt.amount.toString(), debt.token.decimals),
          collateral.token,
          debt.token,
          new Address(address)
        )

      // TODO (see in TxState for more details)
      // const tx = sdk.getTxDetails(
      //   withoutPermits(actions),
      //   collateral.token.chainId,
      //   new Address(address)
      // )
      // const signer = provider.getSigner()
      // // https://github.com/ethers-io/ethers.js/discussions/2439#discussioncomment-1857403
      // const gasLimit = await signer.estimateGas(tx)
      // const gasPrice = (await provider.getFeeData()).maxFeePerGas?.mul(gasLimit)
      // if (gasPrice) {
      //   console.debug({ gasPrice: ethers.utils.formatUnits(gasPrice, "gwei") })
      // }

      set(
        produce((state: TransactionState) => {
          state.transactionMeta.status = "ready"
          state.transactionMeta.bridgeFees = bridgeFee.toNumber()
          state.transactionMeta.estimateTime = estimateTime
          // state.transactionMeta.gasFees = gasPrice?.toNumber() || 0
          state.needPermit = Sdk.needSignature(actions)
          state.actions = actions
        })
      )
    } catch (e) {
      set(
        produce((state: TransactionState) => {
          state.transactionMeta.status = "error"
        })
      )
      console.error("sdk error", e)
    }
  }, 500),

  /**
   * Allow fuji contract to spend on behalf of the user an amount
   * Token are deduced from collateral
   * @param amount
   * @param afterSuccess
   */
  async allow(amount, afterSuccess?) {
    const token = get().position.collateral.token
    const userAddress = useStore.getState().address
    const provider = useStore.getState().provider
    const spender = CONNEXT_ROUTER_ADDRESS[token.chainId].value

    if (!provider || !userAddress) {
      throw "Missing params"
    }

    set(
      produce((s: TransactionState) => {
        s.collateralAllowance.status = "allowing"
      })
    )
    const owner = provider.getSigner()
    try {
      const approval = await contracts.ERC20__factory.connect(
        token.address.value,
        owner
      ).approve(spender, parseUnits(amount.toString()))
      await approval.wait()
      set({ collateralAllowance: { status: "ready", value: amount } })
      afterSuccess && afterSuccess()
    } catch (e) {
      set(
        produce((s: TransactionState) => {
          s.collateralAllowance.status = "error"
        })
      )
    }
  },

  async signPermit() {
    const actions = get().actions
    const vault = get().position.vault
    const provider = useStore.getState().provider
    if (!actions || !vault || !provider) {
      throw "Unexpected undefined value"
    }

    set({ isSigning: true })

    const permitAction = Sdk.findPermitAction(actions)
    if (!permitAction) {
      return
    }

    let signature
    try {
      const { domain, types, value } = await vault.signPermitFor(permitAction)
      const signer = provider.getSigner()
      const s = await signer._signTypedData(domain, types, value)
      signature = ethers.utils.splitSignature(s)
    } catch (e) {
      console.error(e)
    }

    set({ signature, isSigning: false })
  },

  async borrow() {
    const address = useStore.getState().address
    const provider = useStore.getState().provider
    const { actions, signature } = get()
    if (!actions || !address || !signature || !provider) {
      throw "Unexpected undefined param"
    }
    const srcChainId = get().position.collateral.token.chainId

    set({ isBorrowing: true })
    let t
    try {
      const txRequest = sdk.getTxDetails(
        actions,
        srcChainId,
        Address.from(address),
        signature
      )
      const signer = provider.getSigner()
      t = await signer.sendTransaction(txRequest)
    } catch (e) {
      console.log(e)
      // TODO: handle borrow error, if error refuse in metamask or the tx fail for some reason
      return set({ isBorrowing: false })
    }
    set({ transactionStatus: true, showTransactionAbstract: true }) // TODO: Tx successfully sent
    await t.wait()
    set({
      isBorrowing: false,
      transactionStatus: false,
      showTransactionAbstract: false,
    })
    // TODO: set success
    get().updateBalances("debt")
    get().updateAllowance()
    get().updateBalances("collateral")
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
