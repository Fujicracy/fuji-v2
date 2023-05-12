import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import { NOTIFICATION_MESSAGES, SOCIAL_URL } from '../constants';
import { NotificationLink, notify } from './notifications';

enum ErrorCode {
  CANCELLED,
  INSUFFICIENT_FUNDS,
  OTHER,
}

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

export const handleTransactionError = (
  error: unknown,
  cancelledMessage: string,
  failureMessage?: string
) => {
  // error.code is a bit useless there, there are only a handful of them
  const code: ErrorCode =
    error instanceof Error
      ? error.message.includes('user rejected')
        ? ErrorCode.CANCELLED
        : error.message.includes('insufficient funds')
        ? ErrorCode.INSUFFICIENT_FUNDS
        : ErrorCode.OTHER
      : ErrorCode.OTHER;

  const message =
    code === ErrorCode.CANCELLED
      ? cancelledMessage
      : ErrorCode.INSUFFICIENT_FUNDS
      ? NOTIFICATION_MESSAGES.TX_INSUFFICIENT_FUNDS
      : failureMessage ||
        (error instanceof Error ? error.message : String(error));

  const link: NotificationLink | undefined =
    code === ErrorCode.OTHER
      ? { url: SOCIAL_URL.DISCORD, type: 'discord' }
      : undefined;

  notify({
    type: 'error',
    message,
    link,
  });
};
