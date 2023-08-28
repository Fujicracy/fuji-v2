import '../styles/globals.css';

import { ChainvineWidget } from '@chainvine/widget';
import { ThemeProvider, useMediaQuery, useTheme } from '@mui/material';
import { Web3OnboardProvider } from '@web3-onboard/react';
import { VaultType } from '@x-fuji/sdk';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useEffect, useRef } from 'react';

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
import {
  isTopLevelUrl,
  navigationalTaskDelay,
  pathForVaultType,
} from '../helpers/navigation';
import {
  campaignId,
  referralWidgetWidth,
  storeReferrer,
  widgetConfig,
} from '../helpers/referrals';
import { onboard, useAuth } from '../store/auth.store';
import { useHistory } from '../store/history.store';
import { useNavigation } from '../store/navigation.store';
import { usePositions } from '../store/positions.store';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const address = useAuth((state) => state.address);
  const initAuth = useAuth((state) => state.init);

  const currentTxHash = useHistory((state) => state.currentTxHash);
  const isHistoricalTransaction = useHistory(
    (state) => state.isHistoricalTransaction
  );
  const entries = useHistory((state) => state.entries);
  const watchAll = useHistory((state) => state.watchAll);
  const closeModal = useHistory((state) => state.closeModal);

  const changePath = useNavigation((state) => state.changePath);

  const changeShouldPageReset = useNavigation(
    (state) => state.changePageShouldReset
  );
  const changeWillLoad = useNavigation((state) => state.changePageWillLoad);
  const fetchPositions = usePositions((state) => state.fetchUserPositions);

  const entry = address && currentTxHash && entries[currentTxHash];
  const prevAddressRef = useRef<string | undefined>(undefined);

  const startedRef = useRef(false);

  const { isReferralModalOpen, setIsReferralModalOpen } = useNavigation();

  useEffect(() => {
    storeReferrer();
  }, []);

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
      updateOperationNavigation(VaultType.BORROW, url);
      updateOperationNavigation(VaultType.LEND, url);
      updatePollingPolicy(url);
      changePath(url);
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  });

  function updateOperationNavigation(type: VaultType, url: string) {
    const path = pathForVaultType(type);
    const routeIsOperation = url === path;
    changeWillLoad(type, routeIsOperation);
    if (router.asPath === path) {
      changeShouldPageReset(type, routeIsOperation);
    } else {
      navigationalTaskDelay(() => changeShouldPageReset(type, true));
    }
  }

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
          <DisclaimerModal />
          <ExploreCarousel />
          <Notification />
          {address && (
            <ChainvineWidget
              config={widgetConfig}
              isOpen={isReferralModalOpen}
              identifierType={'wallet'}
              userIdentifier={address}
              campaignId={campaignId}
              mode="Modal"
              desktopSize={{
                width: `${referralWidgetWidth(isMobile)}%`,
              }}
              desktopPosition={{
                left: `${(100 - referralWidgetWidth(isMobile)) / 2}%`,
              }}
              theme="Dark"
              themeConfig={{
                inherit: true,
                token: { colorPrimary: theme.palette.primary.main },
              }}
              onToggle={() => setIsReferralModalOpen(false)}
            />
          )}
        </ThemeProvider>
      </Web3OnboardProvider>
    </>
  );
}

export default MyApp;
