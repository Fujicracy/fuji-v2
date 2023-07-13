import CloseIcon from '@mui/icons-material/Close';
import { Collapse, Link, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { ReactNode, useEffect, useState } from 'react';

import { HELPER_URL } from '../../../constants';
import { dismissBanner, getBannerVisibility } from '../../../helpers/banners';
import { fetchGuardedLaunchAddresses } from '../../../helpers/guardedLaunch';
import { useAuth } from '../../../store/auth.store';

type BannerLinkProps = {
  label: string;
  url: string;
};

export type BannerConfig = {
  key: string;
  message?: string;
  link?: BannerLinkProps;
  customMessage?: ReactNode;
  isContrast?: boolean;
};

const BANNERS: BannerConfig[] = [
  {
    key: 'betaTest',
    message:
      'We are in beta, some bugs may arise. We appreciate your feedback as we work diligently to improve the user experience.',
  },
];

const GUARDED_LAUNCH_BANNERS: BannerConfig[] = [
  {
    key: 'guardedLaunch',
    customMessage: (
      <Typography variant="xsmall">
        {`We have released Fuji's official V2 🎉. We are incredibly grateful for
        your participation in the guarded launch. For your support, you can
        claim your NFT on `}
        <BannerLink
          link={{
            label: 'Galxe',
            url: HELPER_URL.GALXE_GUARDED_CAMPAIGN,
          }}
          isContrast
        />
        {`. If you had a position in the guarded launch, you can migrate it from `}
        <BannerLink
          link={{
            label: 'the guarded',
            url: HELPER_URL.GUARDED_LAUNCH,
          }}
          isContrast
        />
        {` to the official version.`}
      </Typography>
    ),
    isContrast: true,
  },
];

function Banners() {
  const [banners, setBanners] = useState<BannerConfig[]>([]);
  const walletAddress = useAuth((state) => state.address);

  useEffect(() => {
    let filteredBanners = BANNERS.filter((banner) =>
      getBannerVisibility(banner.key)
    );

    const guardedLaunchBanners = GUARDED_LAUNCH_BANNERS.filter((banner) =>
      getBannerVisibility(banner.key)
    );

    fetchGuardedLaunchAddresses().then((addresses) => {
      if (
        addresses.includes(walletAddress?.toLowerCase() || '') &&
        window !== undefined &&
        window.location.href !== HELPER_URL.GUARDED_LAUNCH
      ) {
        filteredBanners = filteredBanners.concat(guardedLaunchBanners);
      }

      setBanners(filteredBanners);
    });
  }, [walletAddress]);

  return (
    <Stack
      sx={{
        width: '100%',
      }}
    >
      {banners.map((banner) => (
        <Banner banner={banner} key={banner.key} onDismiss={dismissBanner} />
      ))}
    </Stack>
  );
}

function Banner({
  banner,
  onDismiss,
}: {
  banner: BannerConfig;
  onDismiss: (key: string) => void;
}) {
  const { palette } = useTheme();
  const [isVisible, setIsVisible] = useState(true);

  const onDismissClick = () => {
    setIsVisible(false);
    onDismiss(banner.key);
  };

  return (
    <Collapse in={isVisible} timeout={{ exit: 500 }}>
      <Stack
        p="0.475rem 4.5rem 0.475rem 1rem"
        alignItems="center"
        position="relative"
        sx={{
          backgroundColor: banner.isContrast
            ? palette.primary.dark
            : alpha('#FFFFFF', 0.1),
          textAlign: 'center',
        }}
      >
        {banner.message && (
          <Typography variant="xsmall">
            {banner.message}
            {banner.link && (
              <BannerLink link={banner.link} isContrast={banner.isContrast} />
            )}
          </Typography>
        )}
        {banner.customMessage}
        <CloseIcon
          sx={{
            cursor: 'pointer',
            position: 'absolute',
            top: '50%',
            right: '1rem',
            fontSize: '1.2rem',
            transform: 'translateY(-50%)',
          }}
          onClick={onDismissClick}
        />
      </Stack>
    </Collapse>
  );
}

function BannerLink({
  link,
  isContrast = false,
}: {
  link: BannerLinkProps;
  isContrast?: boolean;
}) {
  return (
    <Link
      href={link?.url}
      target="_blank"
      rel="noreferrer"
      sx={{
        ml: '0.1rem',
        textDecoration: 'underline',
        cursor: 'pointer',
        '&:hover': isContrast
          ? {
              color: 'unset',
            }
          : {},
      }}
    >
      {link?.label}
    </Link>
  );
}

export default Banners;
