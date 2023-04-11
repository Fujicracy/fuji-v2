import { Box, Stack, Typography, useTheme } from '@mui/material';
import { LendingProviderDetails } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';
import React from 'react';

import { ProviderIcon } from '../Icons';

function ProviderRow({
  provider,
  isBorrow,
}: {
  provider: LendingProviderDetails;
  isBorrow?: boolean;
}) {
  const { palette } = useTheme();

  const rate = isBorrow ? provider.borrowRate : provider.depositRate;
  const apr = `${(parseFloat(formatUnits(rate, 27)) * 100).toFixed(2)}%`;

  return (
    <Stack direction="row" justifyContent="space-between" m="0.25rem 0">
      <Stack direction="row" alignItems="center" justifyContent="start">
        <ProviderIcon provider={provider.name} height={16} width={16} />

        <Typography ml="0.375rem" variant="small">
          {provider.name}
        </Typography>
      </Stack>

      <Typography
        variant="smallDark"
        color={isBorrow ? palette.warning.main : palette.success.main}
      >
        {apr}
      </Typography>
    </Stack>
  );
}

function ProvidersTooltip({
  isBorrow = false,
  providers = [],
}: {
  providers?: LendingProviderDetails[];
  isBorrow?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '11.25rem' }}>
      <Typography
        variant="body2"
        sx={{ fontSize: '0.875rem' }}
        mb="0.25rem"
        textAlign="start"
      >
        Integrated Protocols:
      </Typography>
      {providers.map((provider) => (
        <ProviderRow
          key={provider.name}
          provider={provider}
          isBorrow={isBorrow}
        />
      ))}
    </Box>
  );
}

export default ProvidersTooltip;
