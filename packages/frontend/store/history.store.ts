import {
  Address,
  ChainConnection,
  ChainId,
  RoutingStep,
  RoutingStepDetails,
  Token,
} from "@x-fuji/sdk"
import produce from "immer"
import create from "zustand"
import { devtools, persist } from "zustand/middleware"
import { useStore } from "."
import { sdk, sdkInitOptions } from "./auth.slice"
import ethers from "ethers"

import { Position } from "./Position"

export type HistoryStore = HistoryState & HistoryActions

type HistoryState = {
  allHash: string[]
  activeHash: string[] // ongoing tx
  byHash: Record<string, HistoryEntry>

  inModal?: string // The tx hash displayed in modal
  inNotification?: string
}

/**
 * ⚠️ DO NOT STORE CLASSE INSTANCE because they are persisted in localstorage
 * and all methods will be lost. Also POO can be heavy to stringify because
 * of inheriting other classes
 */
export type HistoryEntry = {
  hash: string
  type: "borrow" // || withdraw || flashclose...
  steps: HistoryRoutingStep[]
  status: "ongoing" | "error" | "done"
}

export type HistoryRoutingStep = Omit<
  RoutingStepDetails,
  "txHash" | "token"
> & {
  txHash?: string
  token: SeriazableToken
}

export function toRoutingStepDetails(
  s: HistoryRoutingStep[]
): RoutingStepDetails[] {
  return s.map((s) => ({
    ...s,
    txHash: undefined,
    token: new Token(
      s.token.chainId,
      Address.from(s.token.address),
      s.token.decimals,
      s.token.symbol,
      s.token.name
    ),
  }))
}

export function toHistoryRoutingStep(
  s: RoutingStepDetails[]
): HistoryRoutingStep[] {
  return s.map((s: RoutingStepDetails) => {
    return {
      ...s,
      txHash: undefined,
      token: {
        chainId: s.token.chainId,
        address: s.token.address.value,
        decimals: s.token.decimals,
        symbol: s.token.symbol,
        name: s.token.name,
      },
    }
  })
}

/**
 * Contains all we need to instanciate a token with new Token()
 */
export type SeriazableToken = {
  chainId: ChainId
  address: string
  decimals: number
  symbol: string
  name?: string
}

type HistoryActions = {
  add: (e: HistoryEntry) => void
  update: (hash: string, patch: Partial<HistoryEntry>) => void
  watch: (hash: string) => void

  openModal: (hash: string) => void
  closeModal: () => void

  closeNotification: () => void
}

const initialState: HistoryState = {
  allHash: [],
  activeHash: [],
  byHash: {},
}

export const useHistory = create<HistoryStore>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        // TODO: onboot / start, should we rewatch for all active tx ?

        // Add active transaction
        async add(e) {
          set(
            produce((s: HistoryState) => {
              s.inModal = e.hash
              s.byHash[e.hash] = e
              s.allHash = [e.hash, ...s.allHash]
              s.activeHash = [e.hash, ...s.activeHash]
            })
          )

          get().watch(e.hash)
        },

        async watch(hash) {
          const entry = get().byHash[hash]
          if (!entry) {
            throw `No entry in history for hash ${hash}`
          }

          let receipt: ethers.providers.TransactionReceipt
          // TODO: refacto: as long as we cannot store class methods in storage we should not use it (i.e vault.provider.getSmth)
          const { rpcProvider } = ChainConnection.from(
            sdkInitOptions,
            entry.steps[0].chainId
          )
          if (rpcProvider) {
            console.debug("waitForTransaction", hash)
            receipt = await rpcProvider.waitForTransaction(hash)
          } else {
            return console.error("No provider found in position.vault")
          }

          const startChainId = entry.steps.find(
            (s) => s.step === RoutingStep.START
          )?.chainId
          const endChainId = entry.steps.find(
            (s) => s.step === RoutingStep.END
          )?.chainId
          console.debug({ startChainId, endChainId })
          if (startChainId === endChainId) {
            set(
              produce((s: HistoryState) => {
                const steps = s.byHash[hash].steps
                const b = steps.find((s) => s.step === RoutingStep.BORROW)
                const d = steps.find((s) => s.step === RoutingStep.DEPOSIT)
                if (b) b.txHash = receipt.transactionHash
                if (d) d.txHash = receipt.transactionHash
              })
            )
          } else {
            const stepsWithHash = await sdk.watchTxStatus(
              hash,
              toRoutingStepDetails(entry.steps)
            )

            for (let i = 0; i < stepsWithHash.length; i++) {
              const step = stepsWithHash[i]
              console.debug("waiting", step.step, "...")
              // TODO: can txHash fail ?
              const txHash = await step.txHash
              console.debug("success", step.step, txHash)
              set(
                produce((s: HistoryState) => {
                  s.byHash[hash].steps[i].txHash = txHash
                })
              )
              console.debug(step.step, txHash)
              if (step.step === RoutingStep.DEPOSIT) {
                useStore.getState().updateBalances("collateral")
                useStore.getState().updateAllowance()
              }
              if (step.step === RoutingStep.BORROW) {
                useStore.getState().updateBalances("collateral")
              }
              // TODO: can we have error ? if yes mark the tx as failed. Design ? Retry ?
            }
          }
          get().update(hash, { status: "done" })
          set({
            activeHash: get().activeHash.filter((h) => h !== hash),
            inNotification: hash,
          })
        },

        update(hash, patch) {
          const entry = get().byHash[hash]
          if (!entry) {
            throw `No entry in history for hash ${hash}`
          }
          set(
            produce((s: HistoryState) => {
              s.byHash[hash] = { ...s.byHash[hash], ...patch }
            })
          )
        },

        openModal(hash) {
          const entry = get().byHash[hash]
          if (!entry) {
            console.error("No entry in history for hash", hash)
          }
          set({ inModal: hash })
        },

        closeModal() {
          const inModal = get().inModal
          if (!inModal) {
            return
          }
          if (get().byHash[inModal].status === "ongoing") {
            set({ inNotification: inModal })
          }
          set({ inModal: "" })
        },

        closeNotification() {
          set({ inNotification: "" })
        },
      }),
      {
        enabled: process.env.NEXT_PUBLIC_APP_ENV !== "production",
        name: "xFuji/history",
      }
    ),
    {
      name: "xFuji/history",
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            return console.error("an error happened during hydration", error)
          }
          if (!state) {
            return console.error("no state")
          }
          for (const hash of state.activeHash) {
            state.watch(hash)
          }
        }
      },
    }
  )
)

console.log("watch: ", useHistory.getState().watch)
