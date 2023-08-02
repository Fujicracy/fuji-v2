import { Box, Chip, Stack } from '@mui/material';
import React from 'react';

import { MarketRowStatus } from '../../../store/types/markets';
import { ProviderIcon } from '../Icons';
import { TooltipWrapper } from '../Tooltips';

type IntegratedProvidersProps = {
  providers: {
    status: MarketRowStatus;
    value: string[];
  };
};

function IntegratedProviders({ providers }: IntegratedProvidersProps) {
  return (
    <>
      {providers.status === MarketRowStatus.Ready && (
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          flexWrap="nowrap"
        >
          {providers.value.map((name, i) => (
            <TooltipWrapper key={`${name}-${i}`} title={name} placement="top">
              <Box
                sx={{
                  position: 'relative',
                  mr:
                    i === 2 && providers.value.length === 4
                      ? '-0.5rem'
                      : i !== providers.value.length - 1
                      ? '-0.25rem'
                      : providers.value.length > 4
                      ? '0.5rem'
                      : 0,
                  zIndex: 5 - i,
                  height: '24px',
                }}
              >
                {i <= (providers.value.length > 4 ? 2 : 3) && (
                  <ProviderIcon
                    sx={i === 0 ? {} : { filter: 'brightness(50%)' }} // This is going to be more complex in the future
                    provider={name}
                    height={24}
                    width={24}
                  />
                )}
              </Box>
            </TooltipWrapper>
          ))}
          {providers.value.length > 4 && (
            <Chip
              label={
                <Stack
                  direction="row"
                  justifyContent="center"
                  sx={{ ml: 0.25 }}
                >
                  +{providers.value.length - 4}
                </Stack>
              }
              variant="number"
              sx={{ mr: '-0.75rem' }}
            />
          )}
        </Stack>
      )}
    </>
  );
}

export default IntegratedProviders;
