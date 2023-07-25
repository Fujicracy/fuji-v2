import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { dismissBanner, getBannerVisibility } from '../../../helpers/banners';
import CloseButton from '../CloseButton';

type OnPageBannerProps = {
  key: string;
  title?: string;
  text?: string;
  type?: string;
};

function OnPageBanner({ key, type, text, title }: OnPageBannerProps) {
  const { palette } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const shouldBeVisible = getBannerVisibility(key);
    if (shouldBeVisible) {
      setIsVisible(true);
    }
  }, [key]);

  const onDismissClick = () => {
    setIsVisible(false);
    dismissBanner(key);
  };

  return isVisible ? (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        p: 3,
        mb: 4.5,
        border: '1px solid #2A2E35',
        borderRadius: '0.5rem',
        backgroundImage: `linear-gradient(90deg, #000000 0%, rgba(0, 0, 0, 0.229504) 61.83%, rgba(0, 0, 0, 0) 80.24%),
      linear-gradient(0deg, #131518, #131518)`,
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
      >
        <Stack
          direction="column"
          justifyContent="flex-start"
          sx={{ zIndex: 2 }}
        >
          {type && (
            <Typography
              variant="small"
              fontWeight={700}
              fontSize="0.75rem"
              color={palette.primary.light}
            >
              {type.toUpperCase()}
            </Typography>
          )}
          {title && (
            <Typography variant="h4" fontSize="1.25rem">
              {title}
            </Typography>
          )}
          {text && <Typography variant="small">{text}</Typography>}
        </Stack>
        <Box sx={{ zIndex: 2 }}>
          <CloseButton onClose={onDismissClick} />
        </Box>
      </Stack>
      <Image
        src={'/assets/images/logo/mountain.svg'}
        alt={'mountain icon'}
        width={450}
        height={100}
        style={{
          position: 'absolute',
          right: 4,
          bottom: 0,
          zIndex: 1,
        }}
      />
    </Box>
  ) : null;
}

export default OnPageBanner;
