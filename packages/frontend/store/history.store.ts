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
            console.debug("ok")
            set(
              produce((s: HistoryStore) => {
                s.byHash[e.hash].status = "done"
              })
            )
          } catch (e) {
            console.debug("error")
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
    )
  )
)
