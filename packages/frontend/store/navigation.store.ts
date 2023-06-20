import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { PATH } from '../constants';
import { storeOptions } from '../helpers/stores';

type NavigationState = {
  currentPath: string;
};

type NavigationActions = {
  changePath: (path: string) => void;
};

const initialState: NavigationState = {
  currentPath: PATH.MARKETS,
};

export type NavigationStore = NavigationState & NavigationActions;

export const useNavigation = create<NavigationStore>()(
  devtools(
    (set) => ({
      ...initialState,

      changePath(currentPath) {
        set({ currentPath });
      },
    }),
    storeOptions('navigation')
  )
);
