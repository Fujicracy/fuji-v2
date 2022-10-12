import create, { StateCreator } from "zustand"

interface TransactionSlice {
  transactionStatus: boolean
  setTransactionStatus: (newStatus: boolean) => void
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
})

export const useTransactionStore = create<TransactionSlice>()((...a) => ({
  ...setTransactionStatusSlice(...a),
}))
