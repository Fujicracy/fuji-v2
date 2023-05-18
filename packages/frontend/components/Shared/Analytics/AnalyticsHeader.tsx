import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React from 'react';

import { AssetMeta } from '../../../store/models/Position';
import { TokenIcon } from '../Icons';
import LinkIcon from '../Icons/LinkIcon';

type AnalyticsHeaderProps = {
  collateral: AssetMeta;
  debt: AssetMeta;
  loading: boolean;
};

function AnalyticsHeader({ collateral, debt, loading }: AnalyticsHeaderProps) {
  const { palette } = useTheme();

  return (
    <Stack flexDirection="row" alignItems="center" gap="0.75rem">
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <TokenIcon token={debt.token} height={40} width={40} />
        <TokenIcon
          token={collateral.token}
          height={24}
          width={24}
          sx={{
            position: 'absolute',
            right: '-1rem',
            transform: 'translateY(-100%)',
            zIndex: -1,
          }}
        />
      </Box>
      <Box sx={{ ml: '1rem' }}>
        <Typography
          fontSize="0.875rem"
          lineHeight="160%"
          fontWeight={400}
          color={palette.info.main}
        >
          Collateral: {collateral.token.symbol}
        </Typography>
        <Stack flexDirection="row" alignItems="center">
          <Typography fontSize="1.125rem" lineHeight="160%" fontWeight={700}>
            Borrow: {debt.token.symbol}
          </Typography>
          <Box
            sx={{
              ml: '0.5rem',
              width: '22px',
              height: '22px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: alpha('#222429', 0.5),
              border: `1px solid ${alpha('#3B404A', 0.5)}`,
              borderRadius: '100px',
              cursor: 'pointer',
              '&:hover': {
                '& svg path': {
                  fill: palette.info.main,
                },
              },
            }}
          >
            <LinkIcon />
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}

export default AnalyticsHeader;
