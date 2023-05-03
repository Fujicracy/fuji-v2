import CloseIcon from '@mui/icons-material/Close';
import { Collapse, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import React, { useState } from 'react';

import { BannerConfig } from '../../../constants/banners';

function Banner({
  banner,
  onDismiss,
}: {
  banner: BannerConfig;
  onDismiss: (key: string) => void;
}) {
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
        sx={{ backgroundColor: alpha('#FFFFFF', 0.1) }}
      >
        <Typography variant="xsmall">{banner.message}</Typography>
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

export default Banner;
