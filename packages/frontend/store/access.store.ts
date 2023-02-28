import { guild, setProjectName } from "@guildxyz/sdk"
import produce from "immer"
import { create } from "zustand"
import { useAuth } from "./auth.store"

const FUJI_GUILD_ID = 461
setProjectName("Fuji Finance")

export enum AccessStatus {
  NotConnected,
  Connecting,
  Connected,
  Verifying,
  Access,
  NoAccess,
  Error,
  FatalError,
}

type AccessState = {
  status: AccessStatus
  errorsCount: number
  retriesCount: number
}

type AccessActions = {
  init: () => void
  login: () => void
  logout: () => void
  verifyMember: (addr: string) => void
}

const initialState: AccessState = {
  status: AccessStatus.NoAccess,
  errorsCount: 0,
  retriesCount: 0,
}

export type AccessStore = AccessState & AccessActions

export const useAccess = create<AccessStore>()(
  // devtools(
  (set, get) => ({
    ...initialState,

    init: async () => {
      const addr = useAuth.getState().address

      if (addr) {
        set({ status: AccessStatus.Connected })

        await get().verifyMember(addr)
      }
    },
    login: async () => {
      set({ status: AccessStatus.Connecting })

      await useAuth.getState().login()
      await get().init()
    },
    logout: () => {
      await useAuth.getState().logout()

      set({
        status: AccessStatus.NotConnected,
        retriesCount: 0,
        errorsCount: 0,
      })
    },
    verifyMember: async (addr: string) => {
      set({ status: AccessStatus.Verifying })

      try {
        const reqs = await guild.getUserAccess(FUJI_GUILD_ID, addr)
        if (reqs.find((r) => r.access)) {
          set({ status: AccessStatus.Access })
        } else {
          set(
            produce((state: AccessState) => {
              state.status = AccessStatus.NoAccess
              state.retriesCount++
            })
          )
          // retry in 3 secs
          setTimeout(async () => {
            await get().verifyMember(addr)
          }, 3000)
        }
      } catch (e) {
        set(
          produce((state: AccessState) => {
            if (state.errorsCount > 4) {
              state.status = AccessStatus.FatalError
            } else {
              // increase counter and retry in 3 secs
              state.status = AccessStatus.Error
              state.errorsCount++
              setTimeout(async () => {
                await get().verifyMember(addr)
              }, 3000)
            }
          })
        )
      }
    },
  })
  // {
  //   enabled: process.env.NEXT_PUBLIC_APP_ENV !== "production",
  //   name: "fuji-v2/access",
  // }
  // )
)
