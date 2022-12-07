import create from "zustand"
import { createAuthSlice, AuthStore } from "./auth.slice"
import { createTransactionSlice, TransactionStore } from "./transaction.slice"
// import { devtools } from "zustand/middleware"

export const useStore = create<AuthStore & TransactionStore>()(
  // devtools(
  (...a) => ({
    ...createAuthSlice(...a),
    ...createTransactionSlice(...a),
  })
  // {
  // enabled: process.env.NODE_ENV === "development",
  // }
)
// )
