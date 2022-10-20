import { StateCreator } from "zustand"

export interface TransactionStore {
  transactionStatus: boolean
  showTransactionAbstract: boolean

  setTransactionStatus: (newStatus: boolean) => void
  setShowTransactionAbstract: (show: boolean) => void
}

type TransactionSlice = StateCreator<TransactionStore, [], [], TransactionStore>

export const createTransactionSlice: TransactionSlice = (set) => ({
  transactionStatus: false,
  showTransactionAbstract: false,

  setTransactionStatus: (transactionStatus: boolean) => {
    set({ transactionStatus })
  },

  setShowTransactionAbstract: (showTransactionAbstract: boolean) => {
    set({ showTransactionAbstract })
  },
})
