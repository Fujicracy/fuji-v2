import { RoutingStep, RoutingStepDetails } from "@x-fuji/sdk"
import produce from "immer"
import { has } from "immer/dist/internal"
import create from "zustand"
import { devtools, persist } from "zustand/middleware"
import { useStore } from "."
import { sdk } from "./auth.slice"

import { Position } from "./Position"

export type HistoryStore = HistoryState & HistoryActions

type HistoryState = {
  allHash: string[]
  activeHash: string[] // ongoing tx
  byHash: Record<string, HistoryEntry>

  inModal?: string // The tx hash displayed in modal
  inNotification?: string
}
export type HistoryEntry = {
  hash: string
  type: "borrow" // || withdraw || flashclose...
  position: Position
  steps: RoutingStepDetails[]
  status: "ongoing" | "error" | "done"
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

          const debtToken = entry.position.debt.token
          const collToken = entry.position.collateral.token
          if (debtToken.chainId === collToken.chainId) {
            // Hack, we consider that the transaction will success anyway and we wait for ~2 blocks to display it as successfull
            // Can't find a proper way to use provider.getTransaction(hash) because provider is not set on first render
            // also using useStore.getState() make webpack crash (useStore is undefined which shouldn't be)
            await new Promise((resolve) => setTimeout(resolve, 10000))
          } else {
            const stepsWithHash = await sdk.watchTxStatus(hash, entry.steps)

            for (const step of stepsWithHash) {
              console.time(step.step)
              await step.txHash
              console.timeEnd(step.step)
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
