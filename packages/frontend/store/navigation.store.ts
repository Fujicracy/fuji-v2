import produce from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { PATH } from '../constants';
import {
  BorrowPageNavigation,
  navigationalRunAndResetWithDelay,
} from '../helpers/navigation';
import { storeOptions } from '../helpers/stores';

type NavigationState = {
  currentPath: string;
  borrowPage: BorrowPageNavigation;
};

type NavigationActions = {
  changePath: (path: string) => void;

  changeBorrowPageShouldReset: (reset: boolean, lock?: boolean) => void;
  changeBorrowPageWillLoad: (willLoadBorrow: boolean) => void;
};

const initialState: NavigationState = {
  currentPath: PATH.MARKETS,
  borrowPage: {
    shouldReset: true,
    willLoad: false,
    lock: false,
  },
};

type NavigationStore = NavigationState & NavigationActions;

export const useNavigation = create<NavigationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      changePath(currentPath) {
        set({ currentPath });
      },

      changeBorrowPageShouldReset(shouldReset, lock) {
        if (get().borrowPage.lock) return;
        if (lock !== undefined) {
          navigationalRunAndResetWithDelay((newValue: boolean) => {
            set(
              produce((state: NavigationState) => {
                state.borrowPage.lock = newValue;
              })
            );
          }, lock);
        }
        set(
          produce((state: NavigationState) => {
            state.borrowPage.shouldReset = shouldReset;
          })
        );
      },

      changeBorrowPageWillLoad(willLoadBorrow) {
        navigationalRunAndResetWithDelay((newValue: boolean) => {
          set(
            produce((state: NavigationState) => {
              state.borrowPage.willLoad = newValue;
            })
          );
        }, willLoadBorrow);
      },
    }),
    storeOptions('navigation')
  )
);
