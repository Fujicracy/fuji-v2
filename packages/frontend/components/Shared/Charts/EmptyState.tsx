import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import React from 'react';

function EmptyChartState() {
  const { palette } = useTheme();
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        width: '100%',
        height: '24rem',
        backgroundColor: palette.secondary.dark,
      }}
    >
      <Box
        sx={{
          width: '2.5rem',
          height: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.secondary.main,
          borderRadius: '50%',
          p: '0.5rem',
        }}
      >
        <Image
          src={'/assets/images/shared/chart.svg'}
          alt={'Chart Icon'}
          width={24}
          height={24}
        />
      </Box>
      <Typography variant="body" mt="1.5rem" fontWeight={500}>
        No data
      </Typography>
      <Typography variant="smallDark">
        Data for this vault is unavailable
      </Typography>
    </Stack>
  );
}

export default EmptyChartState;
