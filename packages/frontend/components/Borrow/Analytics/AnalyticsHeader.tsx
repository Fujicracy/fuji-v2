import { Box, Stack, Typography } from '@mui/material';
import React from 'react';

import { AssetMeta } from '../../../store/models/Position';
import { TokenIcon } from '../../Shared/Icons';

type AnalyticsHeaderProps = {
  collateral: AssetMeta;
  debt: AssetMeta;
};

function AnalyticsHeader({ collateral, debt }: AnalyticsHeaderProps) {
  return (
    <Box
      sx={{
        p: '0.75rem 1rem',
        borderRadius: '0.5rem',
      }}
    >
      <Stack flexDirection="row" alignItems="center">
        <Box sx={{ position: 'relative' }}>
          <TokenIcon token={debt.token} height={40} width={40} />
          <TokenIcon
            token={collateral.token}
            height={16}
            width={16}
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              transform: 'translateY(-100%)',
            }}
          />
        </Box>
      </Stack>
      <Typography
        fontSize="1rem"
        lineHeight="160%"
        fontWeight={400}
        mt="0.5rem"
      ></Typography>
    </Box>
  );
}

export default AnalyticsHeader;
