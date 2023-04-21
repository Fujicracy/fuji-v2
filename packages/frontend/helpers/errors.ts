import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import { SOCIAL_URL } from '../constants';
import { NotificationLink, notify } from './notifications';

export const initErrorReporting = () => {
  if (process.env.NEXT_PUBLIC_APP_ENV !== 'production') {
    return;
  }
  Sentry.init({
    dsn: 'https://f64501e2fca94d6c9434a00ed0aece54@o1151449.ingest.sentry.io/4504884437057536',
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0,
  });
};

export const handleCancelableMMActionError = (
  error: unknown,
  cancelledMessage: string,
  failureMessage?: string
) => {
  const userCancelled =
    error instanceof Error &&
    'code' in error &&
    error['code'] === 'ACTION_REJECTED';
  const message = userCancelled
    ? cancelledMessage
    : failureMessage ?? String(error);
  const link: NotificationLink | undefined = userCancelled
    ? undefined
    : { url: SOCIAL_URL.DISCORD, type: 'discord' };
  notify({
    type: 'error',
    message,
    link,
  });
};
