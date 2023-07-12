import CloseIcon from '@mui/icons-material/Close';
import { Collapse, Link, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { ReactNode, useState } from 'react';

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

export function BannerLink({
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

export default Banner;
