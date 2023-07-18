import { Box, Skeleton, Stack, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { ReactNode } from 'react';

import ExtraInfoChip from './ExtraInfoChip';
import InfoTooltip from './Tooltips/InfoTooltip';

type InfoBlockProps = {
  label: string;
  value: ReactNode;
  loading: boolean;
  tooltip?: string;
  contrast?: boolean;
  extra?: string;
};

function InfoBlock({
  label,
  value,
  loading,
  tooltip,
  contrast,
  extra,
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
        height: '100%',
      }}
    >
      {loading ? (
        <Skeleton />
      ) : (
        <Stack flexDirection="row" alignItems="center">
          <Typography variant="smallDark" fontSize="0.75rem">
            {label}
          </Typography>
          {tooltip && !isMobile && <InfoTooltip title={tooltip} />}
        </Stack>
      )}

      {loading ? (
        <Skeleton />
      ) : (
        <Typography
          fontSize="1rem"
          lineHeight="100%"
          fontWeight={400}
          component={'span'}
          sx={{ display: 'inline-block', mt: 1 }}
        >
          {value} <ExtraInfoChip text={extra} />
        </Typography>
      )}
    </Box>
  );
}

export default InfoBlock;
