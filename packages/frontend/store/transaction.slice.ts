import {
  Address,
  BorrowingVault,
  CONNEXT_ROUTER_ADDRESS,
  contracts,
  LendingProviderDetails,
  RouterActionParams,
  RoutingStepDetails,
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
import { toHistoryRoutingStep, useHistory } from "./history.store"

setAutoFreeze(false)

type TransactionSlice = StateCreator<TransactionStore, [], [], TransactionStore>
export type TransactionStore = TransactionState & TransactionActions
type TransactionState = {
  position: Position
  availableVaults: BorrowingVault[]
  availableVaultsStatus: FetchStatus
  // Providers are mapped with their vault address
  allProviders: Record<string, LendingProviderDetails[]>

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
    status: FetchStatus
    gasFees: number // TODO: cannot estimat gas fees until the user has approved AND permit fuji to use its fund
    bridgeFees: number
    estimateTime: number
    steps: RoutingStepDetails[]
  }

  needPermit: boolean
  isSigning: boolean
  signature?: Signature
  actions?: RouterActionParams[]

  isBorrowing: boolean
}
type FetchStatus = "initial" | "fetching" | "ready" | "error"

type TransactionActions = {
  changeBorrowChain: (chainId: ChainId) => void
  changeBorrowToken: (token: Token) => void
  changeBorrowValue: (val: string) => void
  changeCollateralChain: (chainId: ChainId) => void
  changeCollateralToken: (token: Token) => void
  changeCollateralValue: (val: string) => void
  changeActiveVault: (v: BorrowingVault) => void

  updateAllProviders: () => void
  updateTokenPrice: (type: "debt" | "collateral") => void
  updateBalances: (type: "debt" | "collateral") => void
  updateAllowance: () => void
  updateVault: () => void
  updateTransactionMeta: () => void
  updateTransactionMetaDebounced: () => void
  updateLtv: () => void
  updateLiquidation: () => void

  allow: (amount: number, callback: () => void) => void
  signPermit: () => void
  borrow: () => Promise<ethers.providers.TransactionResponse>
  signAndBorrow: () => void
}
type ChainId = string // hex value as string

const initialChainId = "0x1a4"
const initialDebtTokens = sdk.getDebtForChain(parseInt(initialChainId, 16))
const initialCollateralTokens = sdk.getCollateralForChain(
  parseInt(initialChainId, 16)
)

const initialState: TransactionState = {
  availableVaults: [],
  availableVaultsStatus: "initial",
  allProviders: {},
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
    liquidationDiff: 0,
    liquidationPrice: 0,
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
    steps: [],
  },

  needPermit: true,
  isSigning: false,
  isBorrowing: false,
}

export const createTransactionSlice: TransactionSlice = (set, get) => ({
  ...initialState,

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
    get().updateAllowance()
  },

  changeCollateralToken(token) {
    set(
      produce((state: TransactionState) => {
        state.position.collateral.token = token
      })
    )
    get().updateTokenPrice("collateral")
    get().updateVault()
    get().updateAllowance()
  },

  changeCollateralValue(value) {
    set(
      produce((state: TransactionState) => {
        state.collateralInput = value
        state.position.collateral.amount = value ? parseFloat(value) : 0
      })
    )
    get().updateTransactionMetaDebounced()
    get().updateLtv()
    get().updateLiquidation()
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
    get().updateTransactionMetaDebounced()
    get().updateLtv()
    get().updateLiquidation()
  },

  async changeActiveVault(vault) {
    const providers = await vault.getProviders()
    await vault.preLoad()

    const ltvMax = vault.maxLtv
      ? parseInt(ethers.utils.formatUnits(vault.maxLtv, 16))
      : DEFAULT_LTV_MAX
    const ltvThreshold = vault.liqRatio
      ? parseInt(ethers.utils.formatUnits(vault.liqRatio, 16))
      : DEFAULT_LTV_TRESHOLD

    set(
      produce((s: TransactionState) => {
        s.position.vault = vault
        s.position.ltvMax = ltvMax
        s.position.ltvThreshold = ltvThreshold
        s.position.providers = providers
        s.position.activeProvider = providers[0]
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
    const token = get().position[type].token

    let tokenValue = await token.getPriceUSD()
    if (token.symbol === "WETH") {
      // TODO: remove (fix bc value on testnet is too low)
      tokenValue = 1242.42
    }

    set(
      produce((state: TransactionState) => {
        state.position[type].usdValue = tokenValue
      })
    )
    get().updateLtv()
    get().updateLiquidation()
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
    set({ availableVaultsStatus: "fetching" })

    const collateral = get().position.collateral.token
    const debt = get().position.debt.token
    const availableVaults = await sdk.getBorrowingVaultsFor(collateral, debt)
    const [vault] = availableVaults
    if (!vault) {
      // TODO: No vault = error, how to handle that in fe. Waiting for more informations from boyan
      console.error("No available vault")
      set({ availableVaultsStatus: "error" })
      return
    }

    await get().changeActiveVault(vault)
    set({ availableVaults })
    await get().updateAllProviders()
    await get().updateTransactionMeta()
    set({ availableVaultsStatus: "ready" })
  },

  async updateAllProviders() {
    const { availableVaults } = get()

    const allProviders: Record<string, LendingProviderDetails[]> = {}
    for (const v of availableVaults) {
      const providers = await v.getProviders()
      allProviders[v.address.value] = providers
    }

    // TODO: status fetching ?
    set({ allProviders })
  },

  async updateTransactionMeta() {
    const address = useStore.getState().address
    if (!address) {
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
      const { bridgeFee, estimateTime, actions, steps } =
        await sdk.previewDepositAndBorrow(
          vault,
          parseUnits(collateral.amount.toString(), collateral.token.decimals),
          parseUnits(debt.amount.toString(), debt.token.decimals),
          collateral.token,
          debt.token,
          new Address(address)
        )
      if (!actions.length) {
        throw `empty action array returned by sdk.previewDepositAndBorrow with params`
      }
      set(
        produce((state: TransactionState) => {
          state.transactionMeta.status = "ready"
          state.transactionMeta.bridgeFees = bridgeFee.toNumber()
          state.transactionMeta.estimateTime = estimateTime
          state.transactionMeta.steps = steps
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
      console.error("Sdk error while attempting to set meta:", e)
    }
  },

  updateTransactionMetaDebounced: debounce(
    () => get().updateTransactionMeta(),
    500
  ),

  updateLtv() {
    const collateralValue = parseFloat(get().collateralInput)
    const collateralUsdValue = get().position.collateral.usdValue
    const collateral = collateralValue * collateralUsdValue

    const debtValue = parseFloat(get().debtInput)
    const debtUsdValue = get().position.debt.usdValue
    const debt = debtValue * debtUsdValue

    const ltv = collateral && debt ? Math.round((debt / collateral) * 100) : 0

    set(
      produce((s: TransactionState) => {
        s.position.ltv = ltv
      })
    )
  },

  updateLiquidation() {
    const collateralAmount = parseFloat(get().collateralInput)
    const collateralUsdValue = get().position.collateral.usdValue

    const debtValue = parseFloat(get().debtInput)
    const debtUsdValue = get().position.debt.usdValue
    const debt = debtValue * debtUsdValue

    if (!debt || !collateralAmount) {
      return { liquidationPrice: 0, liquidationDiff: 0 }
    }

    const liquidationTreshold = get().position.ltvThreshold

    const liquidationPrice =
      debt / (collateralAmount * (liquidationTreshold / 100))
    const liquidationDiff = Math.round(
      (1 - liquidationPrice / collateralUsdValue) * 100
    )

    set(
      produce((s: TransactionState) => {
        s.position.liquidationPrice = liquidationPrice
        s.position.liquidationDiff = liquidationDiff
      })
    )
  },

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
      console.error("No permit action found")
      return set({ isSigning: false })
    }

    let signature
    try {
      const { domain, types, value } = await vault.signPermitFor(permitAction)
      const signer = provider.getSigner()
      const s = await signer._signTypedData(domain, types, value)
      signature = ethers.utils.splitSignature(s)
    } catch (e) {
      set({ isSigning: false })
      throw e
    }

    set({ signature, isSigning: false })
  },

  async borrow() {
    const address = useStore.getState().address
    const provider = useStore.getState().provider
    const { actions, signature, position, transactionMeta } = get()
    if (!actions || !address || !signature || !provider) {
      throw "Unexpected undefined param"
    }
    const srcChainId = position.collateral.token.chainId

    try {
      set({ isBorrowing: true })

      const txRequest = sdk.getTxDetails(
        actions,
        srcChainId,
        Address.from(address),
        signature
      )
      const signer = provider.getSigner()
      const t = await signer.sendTransaction(txRequest)
      set(
        produce((s: TransactionState) => {
          if (s.collateralAllowance.value) {
            // optimistic: we assume transaction will success and update allowance according to that
            s.collateralAllowance.value -= s.position.collateral.amount
          }
        })
      )
      return t
    } catch (e) {
      // TODO: user cancel tx
      throw e
    } finally {
      set({ isBorrowing: false })
    }
  },

  async signAndBorrow() {
    try {
      await get().signPermit()
      const t = await get().borrow()
      useHistory.getState().add({
        hash: t.hash,
        type: "borrow",
        steps: toHistoryRoutingStep(get().transactionMeta.steps),
        status: "ongoing",
      })
      get().changeCollateralValue("")
      get().changeBorrowValue("")
    } catch (e) {
      console.error(e)
    }
  },
})
