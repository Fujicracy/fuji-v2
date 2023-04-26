import { Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { BannerConfig } from '../../../constants/banners';

function Banner({
  banner,
  onDismiss,
}: {
  banner: BannerConfig;
  onDismiss: (key: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const onDismissClick = () => {
    setIsVisible(false);
    onDismiss(banner.key);
  };

  return (
    <Stack
      p="0.475rem 4.5rem 0.475rem 1rem"
      alignItems="center"
      position="relative"
    >
      <Typography variant="xsmall">{banner.message}</Typography>
      <Typography
        variant="xsmall"
        sx={{
          position: 'absolute',
          top: '0.475rem',
          right: '1rem',
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
        onClick={onDismissClick}
      >
        Dismiss
      </Typography>
    </Stack>
  );
}

export default Banner;
