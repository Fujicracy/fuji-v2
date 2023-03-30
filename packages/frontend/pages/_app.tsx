import '../styles/globals.css';

import { ThemeProvider } from '@mui/material';
import { Web3OnboardProvider } from '@web3-onboard/react';
import mixpanel from 'mixpanel-browser';
import { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

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
import { useBorrow } from '../store/borrow.store';
import { useHistory } from '../store/history.store';
import { usePositions } from '../store/positions.store';
import { theme } from '../styles/theme';

const inter = Inter({ subsets: ['latin'] });

function MyApp({ Component, pageProps }: AppProps) {
  const initAuth = useAuth((state) => state.init);
  const address = useAuth((state) => state.address);
  const router = useRouter();

  const currentTxHash = useHistory((state) => state.inModal);
  const fetchPositions = usePositions((state) => state.fetchUserPositions);
  const updateVault = useBorrow((state) => state.updateVault);
  const updateAvailableRoutes = useBorrow(
    (state) => state.updateAvailableRoutes
  );

  useEffect(() => {
    mixpanel.init('030ddddf19623797be516b634956d108', {
      debug: process.env.NEXT_PUBLIC_APP_ENV === 'development',
    });
    initErrorReporting();
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (address) {
      fetchPositions();
      updateVault();
    }
  }, [address, fetchPositions, updateVault]);

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
        updateAvailableRoutes([]);
        fetchPositions();
        updateVault();
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
      <style jsx global>{`
        html {
          font-family: ${inter.style.fontFamily};
        }
      `}</style>

      <Web3OnboardProvider web3Onboard={onboard}>
        <ThemeProvider theme={theme}>
          <div className="backdrop"></div>
          <Component {...pageProps} />
          <TransactionModal
            hash={currentTxHash}
            currentPage={router.pathname}
          />
          <SafetyNoticeModal />
          <Notification />
        </ThemeProvider>
      </Web3OnboardProvider>
    </>
  );
}

export default MyApp;
