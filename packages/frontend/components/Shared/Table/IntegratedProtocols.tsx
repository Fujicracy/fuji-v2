import { Box, Chip, Stack, Tooltip } from '@mui/material';
import React from 'react';

import { MarketRowStatus } from '../../../helpers/markets';
import { ProviderIcon } from '../Icons';

function IntegratedProtocols({
  protocols,
}: {
  protocols: {
    status: MarketRowStatus;
    value: string[];
  };
}) {
  return (
    <>
      {protocols.status === MarketRowStatus.Ready && (
        <Stack
          direction="row"
          justifyContent="right"
          alignItems="center"
          flexWrap="nowrap"
          sx={{
            mr: protocols.value.length > 1 ? '-0.25rem' : '0',
          }}
        >
          {protocols.value.map((name, i) => (
            <Tooltip key={name} title={name} arrow>
              <Box
                sx={{
                  position: 'relative',
                  right: `${i * 0.25}rem`,
                  zIndex: 4 - i,
                  height: '24px',
                }}
              >
                {i <= 2 && (
                  <ProviderIcon provider={name} height={24} width={24} />
                )}
              </Box>
            </Tooltip>
          ))}
          {protocols.value.length >= 4 && (
            <Chip
              label={
                <Stack direction="row" justifyContent="center">
                  +{protocols.value.length - 3}
                </Stack>
              }
              variant="number"
            />
          )}
        </Stack>
      )}
    </>
  );
}

export default IntegratedProtocols;
