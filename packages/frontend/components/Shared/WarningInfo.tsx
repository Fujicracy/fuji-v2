import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Image from 'next/image';
import React from 'react';

function WarningInfo({ text }: { text: string }) {
  const { palette } = useTheme();

  return (
    <Box
      p={1}
      sx={{ flex: 1, backgroundColor: alpha(palette.warning.main, 0.1) }}
      borderRadius={2}
    >
      <Stack flexDirection="row" alignItems="center" gap={2}>
        <Image
          src="/assets/images/shared/warning.svg"
          width={15}
          height={15}
          alt="Warning Icon"
        />
        <Typography
          variant="xsmall"
          color={palette.warning.main}
          lineHeight="160%"
          textAlign="left"
        >
          {text}
        </Typography>
      </Stack>
    </Box>
  );
}

export default WarningInfo;
