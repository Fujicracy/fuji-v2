import create from "zustand"
import { createAuthSlice, AuthStore } from "./auth.slice"
import { createTransactionSlice, TransactionStore } from "./transaction.slice"

export const useStore = create<AuthStore & TransactionStore>()((...a) => ({
  ...createAuthSlice(...a),
  ...createTransactionSlice(...a),
}))
