import create, { StateCreator } from "zustand"

interface TransactionSlice {
  transactionStatus: boolean
  setTransactionStatus: (newStatus: boolean) => void
  showTransactionAbstract: boolean
  setShowTransactionAbstract: (show: boolean) => void
}

const setTransactionStatusSlice: StateCreator<
  TransactionSlice,
  [],
  [],
  TransactionSlice
> = (set) => ({
  transactionStatus: false,
  setTransactionStatus: (newStatus: boolean) =>
    set((state) => ({ transactionStatus: newStatus })),
  showTransactionAbstract: false,
  setShowTransactionAbstract: (show: boolean) =>
    set((state) => ({ showTransactionAbstract: show })),
})

export const useTransactionStore = create<TransactionSlice>()((...a) => ({
  ...setTransactionStatusSlice(...a),
}))
