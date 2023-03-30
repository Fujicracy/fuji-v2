import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

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
