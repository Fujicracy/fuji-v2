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
          justifyContent="right"
          alignItems="center"
          flexWrap="nowrap"
        >
          {providers.value.map((name, i) => (
            <TooltipWrapper key={`${name}-${i}`} title={name} placement="top">
              <Box
                sx={{
                  position: 'relative',
                  mr: `-0.25rem`,
                  zIndex: 4 - i,
                  height: '24px',
                }}
              >
                {i <= 2 && (
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
          {providers.value.length >= 4 && (
            <Chip
              label={
                <Stack direction="row" justifyContent="center">
                  +{providers.value.length - 3}
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

export default IntegratedProviders;
