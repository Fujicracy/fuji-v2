import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import { HELPER_URL, NOTIFICATION_MESSAGES, SENTRY_DSN } from '../constants';
import {
  NotificationLink,
  NotificationLinkType,
  notify,
} from './notifications';

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
    dsn: SENTRY_DSN,
  });
};

export const sendToSentry = (error: unknown) => Sentry.captureException(error);

export const stringifyError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const handleTransactionError = (
  error: unknown,
  cancelledMessage: string,
  failureMessage?: string
) => {
  // error.code is a bit useless there, there are only a handful of them
  const code: ErrorCode = !(error instanceof Error)
    ? ErrorCode.OTHER
    : error.message.includes('user rejected')
    ? ErrorCode.CANCELLED
    : error.message.includes('insufficient funds')
    ? ErrorCode.INSUFFICIENT_FUNDS
    : ErrorCode.OTHER;

  const message =
    code === ErrorCode.CANCELLED
      ? cancelledMessage
      : code === ErrorCode.INSUFFICIENT_FUNDS
      ? NOTIFICATION_MESSAGES.TX_INSUFFICIENT_FUNDS
      : failureMessage || stringifyError(error);

  const link: NotificationLink | undefined =
    code === ErrorCode.OTHER
      ? { url: HELPER_URL.DISCORD, type: NotificationLinkType.DISCORD }
      : undefined;

  notify({
    type: 'error',
    message,
    link,
    sticky: code === ErrorCode.OTHER,
  });
};
