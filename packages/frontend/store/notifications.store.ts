import produce from 'immer';
import { toast } from 'react-toastify';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

import { getLinkNotification } from '../helpers/notifications';

export type HistoryStore = NotificationsState & NotificationsActions;

export enum HistoryEntryStatus {
  ONGOING,
  DONE,
  ERROR,
}

type NotificationsState = {
  notifications: Notification[];
};

/** Defines notification entity. */
export class Notification {
  constructor(
    public id: string = '',
    public status: string = '',
    public type: string = '',
    public title: string = '',
    public message: string = '',
    public createdAt: string = ''
  ) {}
}

enum ToastNotificationsTypes {
  error = 'error',
  info = 'info',
  success = 'success',
  warning = 'warning',
}

type NotifyArgs = {
  message: string;
  type: ToastNotificationsTypes;
};

type NotificationsActions = {
  notify: (notifyArgs: NotifyArgs) => void;
  success: (message: string, isLink: boolean) => void;
};

const initialState: NotificationsState = {
  notifications: [],
};

export const useNotifications = create<HistoryStore>()(
  persist(
    devtools(
      (set, get) => ({
        ...initialState,

        notify({ message, type }: NotifyArgs) {
          const notification = new Notification();

          toast[type](message, {
            position: toast.POSITION.TOP_RIGHT,
            theme: 'dark',
          });

          set(
            produce((s: NotificationsState) => {
              s.notifications = [...s.notifications, notification];
            })
          );
        },

        success(message, isLink) {
          if (isLink) {
            toast(getLinkNotification(message));

            return;
          }
          get().notify({ message, type: ToastNotificationsTypes.success });
        },
      }),
      {
        enabled: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
        name: 'xFuji/notifications',
      }
    ),
    {
      name: 'xFuji/notifications',
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            return console.error('an error happened during hydration', error);
          }
          if (!state) {
            return console.error('no state');
          }
        };
      },
    }
  )
);
