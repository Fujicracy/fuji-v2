import { Box, Skeleton, Stack, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { ReactNode } from 'react';

import InfoTooltip from '../Tooltips/InfoTooltip';

type InfoBlockProps = {
  label: string;
  value: ReactNode;
  loading: boolean;
  tooltip?: string;
  contrast?: boolean;
};

function InfoBlock({
  label,
  value,
  loading,
  tooltip,
  contrast,
}: InfoBlockProps) {
  const { breakpoints, palette } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  return (
    <Box
      sx={{
        p: '0.75rem 1rem',
        backgroundColor: contrast
          ? palette.secondary.contrastText
          : alpha('#FFFFFF', 0.03),
        borderRadius: '0.5rem',
      }}
    >
      {loading ? (
        <Skeleton />
      ) : (
        <Stack flexDirection="row" alignItems="center">
          <Typography variant="smallDark" fontSize="0.75rem">
            {label}
          </Typography>
          {tooltip && !isMobile && <InfoTooltip title={'test'} />}
        </Stack>
      )}

      {loading ? (
        <Skeleton />
      ) : (
        <Typography
          fontSize="1rem"
          lineHeight="160%"
          fontWeight={400}
          mt="0.5rem"
        >
          {value}
        </Typography>
      )}
    </Box>
  );
}

export default InfoBlock;
