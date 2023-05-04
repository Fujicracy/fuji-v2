import { guild, setProjectName } from '@guildxyz/sdk';
import produce from 'immer';
import { create } from 'zustand';

import { useAuth } from './auth.store';

const FUJI_GUILD_ID = 20084;
setProjectName('Fuji Finance');

export enum AccessStatus {
  Verifying,
  Verified,
  NoAccess,
  // after 5 retries Error turns into FatalError
  Error,
  FatalError,
}

type AccessState = {
  status: AccessStatus;
  errorsCount: number;
  retriesCount: number;
};

type AccessActions = {
  reset: () => void;
  verify: () => void;
};

const initialState: AccessState = {
  status: AccessStatus.NoAccess,
  errorsCount: 0,
  retriesCount: 0,
};

export type AccessStore = AccessState & AccessActions;

export const useAccess = create<AccessStore>()(
  // devtools(
  (set, get) => ({
    ...initialState,

    reset: () => {
      set({
        status: AccessStatus.NoAccess,
        retriesCount: 0,
        errorsCount: 0,
      });
    },
    // check every 6 seconds if user is a member of the guild
    // so that we can detect in real time when they do become a member
    verify: async () => {
      set({ status: AccessStatus.Verifying });
      const addr = useAuth.getState().address;

      if (!addr) {
        get().reset();
        return;
      }

      try {
        const reqs = await guild.getUserAccess(FUJI_GUILD_ID, addr as string);
        if (reqs.find((r) => r.access)) {
          set({ status: AccessStatus.Verified });
        } else {
          set(
            produce((state: AccessState) => {
              state.status = AccessStatus.NoAccess;
              state.retriesCount++;
            })
          );
          // retry in 6 secs
          setTimeout(() => {
            get().verify();
          }, 6000);
        }
      } catch (e) {
        set(
          produce((state: AccessState) => {
            if (state.errorsCount > 4) {
              state.status = AccessStatus.FatalError;
            } else {
              // increase counter and retry in 6 secs
              state.status = AccessStatus.Error;
              state.errorsCount++;
              setTimeout(() => {
                get().verify();
              }, 6000);
            }
          })
        );
      }
    },
  })
  // {
  //   enabled: process.env.NEXT_PUBLIC_APP_ENV !== "production",
  //   name: "fuji-v2/access",
  // }
  // )
);
