import { toast } from 'react-toastify';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

import { getLinkNotification } from '../helpers/notifications';

export type NotificationsStore = NotificationsActions;

enum ToastNotificationsTypes {
  error = 'error',
  info = 'info',
  success = 'success',
  warning = 'warning',
}

type NotifyArgs = {
  message: string;
  type: ToastNotificationsTypes;
  link?: string;
};

type NotificationsActions = {
  notify: (notifyArgs: NotifyArgs) => void;
};

export const useNotifications = create<NotificationsStore>()(
  persist(
    devtools(
      (set, get) => ({
        notify({ message, type, link }: NotifyArgs) {
          if (link) {
            toast(getLinkNotification(message));

            return;
          }

          toast[type](message, {
            position: toast.POSITION.TOP_RIGHT,
            theme: 'dark',
          });
        },
      }),
      {
        enabled: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
        name: 'xFuji/notifications',
      }
    ),
    {
      name: 'xFuji/notifications',
    }
  )
);
