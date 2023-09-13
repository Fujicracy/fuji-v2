import CloseIcon from '@mui/icons-material/Close';
import { Collapse, Link, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import React, { ReactNode, useState } from 'react';

import { PATH, SHUTDOWN_BLOG_POST_URL } from '../../../constants';

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

function Banners() {
  const router = useRouter();

  const BANNERS: BannerConfig[] = [
    {
      key: 'shutdownBanner',
      customMessage: (
        <Typography variant="xsmall">
          {`🚨Attention 📢  We are closing down the company and halting all work to the protocol. Please close your`}
          <span
            onClick={() => router.push(PATH.MY_POSITIONS)}
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: '0.2rem',
            }}
          >
            positions
          </span>
          {` and withdraw your funds prior to Dec 31th. For more information, read `}
          <BannerLink link={{ label: 'here', url: SHUTDOWN_BLOG_POST_URL }} />
        </Typography>
      ),
      isContrast: true,
    },
  ];

  return (
    <Stack
      sx={{
        width: '100%',
      }}
    >
      {BANNERS.map((banner) => (
        <Banner banner={banner} key={banner.key} />
      ))}
    </Stack>
  );
}

function Banner({
  banner,
  onDismiss,
}: {
  banner: BannerConfig;
  onDismiss?: (key: string) => void;
}) {
  const { palette } = useTheme();
  const [isVisible, setIsVisible] = useState(true);

  const onDismissClick = () => {
    setIsVisible(false);
    onDismiss && onDismiss(banner.key);
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
        {onDismiss && (
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
        )}
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
