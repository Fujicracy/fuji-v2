import '../styles/globals.css';

import { ThemeProvider } from '@mui/material';
import { Web3OnboardProvider } from '@web3-onboard/react';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useEffect, useRef } from 'react';

import { GuildAccess } from '../components/App/GuildAccess';
import Header from '../components/App/Header/Header';
import Notification from '../components/App/Notification';
import DisclaimerModal from '../components/App/Onboarding/DisclaimerModal';
import ExploreCarousel from '../components/App/Onboarding/ExploreCarousel';
import TransactionModal from '../components/App/TransactionModal';
import { PATH } from '../constants';
import {
  changeERC20PollingPolicy,
  pollBalances,
  stopPolling,
} from '../helpers/balances';
import { initErrorReporting } from '../helpers/errors';
import { isTopLevelUrl, navigationalTaskDelay } from '../helpers/navigation';
import { onboard, useAuth } from '../store/auth.store';
import { useBorrow } from '../store/borrow.store';
import { useHistory } from '../store/history.store';
import { usePositions } from '../store/positions.store';
import { theme } from '../styles/theme';

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV;

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const address = useAuth((state) => state.address);
  const initAuth = useAuth((state) => state.init);

  const currentTxHash = useHistory((state) => state.currentTxHash);
  const isHistoricalTransaction = useHistory(
    (state) => state.isHistoricalTransaction
  );
  const entries = useHistory((state) => state.entries);
  const watchAll = useHistory((state) => state.watchAll);
  const closeModal = useHistory((state) => state.closeModal);

  const changeShouldPageReset = useBorrow(
    (state) => state.changeBorrowPageShouldReset
  );
  const changeWillLoadBorrow = useBorrow(
    (state) => state.changeBorrowPageWillLoadBorrow
  );

  const fetchPositions = usePositions((state) => state.fetchUserPositions);

  const entry = address && currentTxHash && entries[currentTxHash];
  const prevAddressRef = useRef<string | undefined>(undefined);

  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      initErrorReporting();
      initAuth();
    }
  }, [initAuth]);

  useEffect(() => {
    if (address) {
      fetchPositions();
    }
  }, [address, fetchPositions]);

  useEffect(() => {
    if (address && prevAddressRef.current !== address) {
      watchAll(address);
    }
    prevAddressRef.current = address;
  }, [address, watchAll]);

  useEffect(() => {
    if (
      currentTxHash &&
      ((address && prevAddressRef.current !== address) ||
        (!address && prevAddressRef.current))
    ) {
      closeModal(); // Makes sure the modal is closed when the user changes address
    }
  }, [address, currentTxHash, closeModal]);

  useEffect(() => {
    if (address) {
      updatePollingPolicy(router.asPath);
      pollBalances();
    } else {
      stopPolling();
    }
    return () => {
      stopPolling();
    };
  }, [address, router]);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const isTop = isTopLevelUrl(url);
      if (isTop && address) {
        fetchPositions();
      }
      updatePollingPolicy(url);
      const routeIsBorrow = url === PATH.BORROW;
      changeWillLoadBorrow(routeIsBorrow);
      if (router.asPath === PATH.BORROW) {
        changeShouldPageReset(routeIsBorrow);
      } else {
        navigationalTaskDelay(() => changeShouldPageReset(true));
      }
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  });

  function updatePollingPolicy(url: string) {
    const should =
      url === PATH.BORROW || url.includes(PATH.POSITION.split('[pid]')[0]);
    changeERC20PollingPolicy(should);
  }
  if (!startedRef.current) return <></>;
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

      <Web3OnboardProvider web3Onboard={onboard}>
        <ThemeProvider theme={theme}>
          <div className="backdrop"></div>
          <Header />
          <Component {...pageProps} />
          {entry && entry.address === address && (
            <TransactionModal
              entry={entry}
              currentPage={router.pathname}
              isHistoricalTransaction={isHistoricalTransaction}
            />
          )}
          {APP_ENV === 'production' && <GuildAccess />}
          <DisclaimerModal />
          <ExploreCarousel />
          <Notification />
        </ThemeProvider>
      </Web3OnboardProvider>
    </>
  );
}

export default MyApp;
