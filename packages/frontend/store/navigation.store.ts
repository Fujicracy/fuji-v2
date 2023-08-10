import { VaultType } from '@x-fuji/sdk';
import produce from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { PATH } from '../constants';
import {
  navigationalRunAndResetWithDelay,
  OperationPageNavigation,
} from '../helpers/navigation';
import { storeOptions } from '../helpers/stores';

type NavigationState = {
  currentPath: string;
  borrowPage: OperationPageNavigation;
  lendPage: OperationPageNavigation;
};

const initialOperationNavigationState: OperationPageNavigation = {
  shouldReset: true,
  willLoad: false,
  lock: false,
};

type NavigationActions = {
  changePath: (path: string) => void;

  changePageShouldReset: (
    type: VaultType,
    reset: boolean,
    lock?: boolean
  ) => void;
  changePageWillLoad: (type: VaultType, willLoad: boolean) => void;
};

const initialState: NavigationState = {
  currentPath: PATH.MARKETS,
  borrowPage: initialOperationNavigationState,
  lendPage: initialOperationNavigationState,
};

type NavigationStore = NavigationState & NavigationActions;

export const useNavigation = create<NavigationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      changePath(currentPath) {
        set({ currentPath });
      },

      changePageShouldReset(type, shouldReset, lock) {
        if (
          (type === VaultType.BORROW ? get().borrowPage : get().lendPage).lock
        )
          return;
        if (lock !== undefined) {
          navigationalRunAndResetWithDelay((newValue: boolean) => {
            set(
              produce((state: NavigationState) => {
                if (type === VaultType.BORROW) {
                  state.borrowPage.lock = newValue;
                } else {
                  state.lendPage.lock = newValue;
                }
              })
            );
          }, lock);
        }
        set(
          produce((state: NavigationState) => {
            if (type === VaultType.BORROW) {
              state.borrowPage.shouldReset = shouldReset;
            } else {
              state.lendPage.shouldReset = shouldReset;
            }
          })
        );
      },

      changePageWillLoad(type, willLoad) {
        navigationalRunAndResetWithDelay((newValue: boolean) => {
          set(
            produce((state: NavigationState) => {
              if (type === VaultType.BORROW) {
                state.borrowPage.willLoad = newValue;
              } else {
                state.lendPage.willLoad = newValue;
              }
            })
          );
        }, willLoad);
      },
    }),
    storeOptions('navigation')
  )
);
