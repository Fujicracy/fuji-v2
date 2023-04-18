import '../styles/globals.css';

import { ThemeProvider } from '@mui/material';
import { Web3OnboardProvider } from '@web3-onboard/react';
import { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useEffect, useRef } from 'react';

import TransactionModal from '../components/Borrow/TransactionModal';
import SafetyNoticeModal from '../components/Onboarding/SafetyNoticeModal';
import Notification from '../components/Shared/Notification';
import { PATH } from '../constants';
import {
  changeERC20PollingPolicy,
  pollBalances,
  stopPolling,
} from '../helpers/balances';
import { initErrorReporting } from '../helpers/errors';
import { isTopLevelUrl } from '../helpers/navigation';
import { onboard, useAuth } from '../store/auth.store';
import { useHistory } from '../store/history.store';
import { usePositions } from '../store/positions.store';
import { theme } from '../styles/theme';

const inter = Inter({ subsets: ['latin'] });

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const address = useAuth((state) => state.address);
  const initAuth = useAuth((state) => state.init);

  const currentTxHash = useHistory((state) => state.currentTxHash);
  const ongoingTransactions = useHistory((state) => state.ongoingTransactions);
  const entries = useHistory((state) => state.entries);
  const watchAll = useHistory((state) => state.watchAll);

  const fetchPositions = usePositions((state) => state.fetchUserPositions);

  const entry = address && currentTxHash && entries[currentTxHash];
  const prevAddressRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    initErrorReporting();
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (address) {
      fetchPositions();
    }
  }, [address, fetchPositions]);

  useEffect(() => {
    if (address && prevAddressRef.current !== address) {
      watchAll();
    }
    prevAddressRef.current = address;
  }, [address, ongoingTransactions, watchAll]);

  useEffect(() => {
    if (address) {
      pollBalances();
    } else {
      stopPolling();
    }
    return () => {
      stopPolling();
    };
  }, [address]);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const isTop = isTopLevelUrl(url);
      if (isTop && address) {
        fetchPositions();
      }
      const should =
        url === PATH.BORROW || url.includes(PATH.POSITION.split('[pid]')[0]);
      changeERC20PollingPolicy(should);
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  });

  return (
    <>
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-NSCGPLH');
      `}
      </Script>
      <style jsx global>{`
        html {
          font-family: ${inter.style.fontFamily};
        }
      `}</style>

      <Web3OnboardProvider web3Onboard={onboard}>
        <ThemeProvider theme={theme}>
          <div className="backdrop"></div>
          <Component {...pageProps} />
          {entry && entry.address === address && (
            <TransactionModal entry={entry} currentPage={router.pathname} />
          )}
          <SafetyNoticeModal />
          <Notification />
        </ThemeProvider>
      </Web3OnboardProvider>
    </>
  );
}

export default MyApp;
