import { ethers } from "ethers"
import produce from "immer"
import create from "zustand"
import { devtools, persist } from "zustand/middleware"
import { useStore } from "."

import { Position } from "./Position"

export type HistoryStore = HistoryState & HistoryActions

type HistoryState = {
  allHash: string[]
  byHash: Record<string, HistoryEntry>

  inModal?: string // The tx hash displayed in modal
  inNotification?: string
}
export type HistoryEntry = {
  hash: string
  type: "borrow" // || withdraw || flashclose...
  position: Position
  status: "ongoing" | "error" | "done"
}

type HistoryActions = {
  add: (e: HistoryEntry, t: ethers.providers.TransactionResponse) => void
  update: (hash: string, patch: Partial<HistoryEntry>) => void

  openModal: (hash: string) => void
  closeModal: () => void

  closeNotification: () => void
}

const initialState: HistoryState = {
  allHash: [],
  byHash: {},
}

export const useHistory = create<HistoryStore>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        // Add ongoing transaction
        async add(e, t) {
          set(
            produce((s: HistoryState) => {
              s.inModal = e.hash
              s.byHash[e.hash] = e
              s.allHash = [e.hash, ...s.allHash]
            })
          )

          // Deposit & borrow on the same chain, just wait for 1 confirmation
          try {
            await t.wait()
            set(
              produce((s: HistoryStore) => {
                s.byHash[e.hash].status = "done"
              })
            )
          } catch (err) {
            console.error(err)
            // TODO: Display notification or smth ?
            set(
              produce((s: HistoryStore) => {
                s.byHash[e.hash].status = "error"
              })
            )
          }
          console.debug("after")
          useStore.getState().updateBalances("debt")
          useStore.getState().updateBalances("collateral")
          useStore.getState().updateAllowance()
        },

        update(hash, patch) {
          const entry = get().byHash[hash]
          if (!entry) {
            console.error("No entry in history for hash", hash)
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
    { name: "xFuji/history" }
  )
)
