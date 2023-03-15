import produce from "immer"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

export type SnackStore = SnackState & SnackActions

type SnackState = {
  notifications: Snack[]
}

export type Snack = {
  /**
   * Icon displayed on the left of the notification
   * @default undefined (hidden)
   */
  type: "success" | "warning" | "error"
  icon?: string
  title: string
  body?: string | React.ReactNode
  /**
   * If you want to display a link to the transaction at the bottom of the notification
   */
  transactionUrl?: { hash?: string; chainId?: number }
  /**
   * @default 8000 (in milliseconds)
   */
  autoHideDuration?: number
}

type SnackActions = {
  display: (n: Snack) => void
  close: (n: Snack) => void
}

const initialState: SnackState = {
  notifications: [],
}

export const useSnack = create<SnackStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      display(n) {
        set(
          produce((s: SnackState) => {
            n.icon = n.type
            if (!n.autoHideDuration) {
              n.autoHideDuration = 3000 // We need to choose a default value, 3 seconds is probably ok
            }
            s.notifications.push(n)
          })
        )
      },

      close(n) {
        const notifications = get().notifications.filter((notif) => notif !== n)
        set({ notifications })
      },
    }),
    {
      enabled: process.env.NEXT_PUBLIC_APP_ENV !== "production",
      name: "xFuji/notifications",
    }
  )
)
