import create from "zustand"
import { createAuthSlice, AuthStore } from "./auth.slice"
import { devtools } from "zustand/middleware"

export const useStore = create<AuthStore>()(
  // devtools(
  (...a) => ({
    ...createAuthSlice(...a),
    // ...createTransactionSlice(...a),
  })
  // {
  // enabled: process.env.NODE_ENV === "development",
  // }
  // )
)
