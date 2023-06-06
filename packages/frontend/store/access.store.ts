import { guild, setProjectName } from '@guildxyz/sdk';
import produce from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { storeOptions } from '../helpers/stores';
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
  retry: (status: AccessStatus) => void;
  verify: () => void;
};

const initialState: AccessState = {
  status: AccessStatus.NoAccess,
  errorsCount: 0,
  retriesCount: 0,
};

export type AccessStore = AccessState & AccessActions;

const MAX_ERRORS = 4;
const RETRY_DELAY = 6000;

export const useAccess = create<AccessStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      reset: () => {
        set({
          status: AccessStatus.NoAccess,
          retriesCount: 0,
          errorsCount: 0,
        });
      },

      retry: (status) => {
        set(
          produce((state: AccessState) => {
            if (state.errorsCount > MAX_ERRORS) {
              state.status = AccessStatus.FatalError;
              return;
            }
            state.status = status;
            state.retriesCount++;

            // retry in 6 secs
            setTimeout(() => {
              get().verify();
            }, RETRY_DELAY);
          })
        );
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
            get().retry(AccessStatus.NoAccess);
          }
        } catch (e) {
          get().retry(AccessStatus.Error);
        }
      },
    }),
    storeOptions('access')
  )
);
