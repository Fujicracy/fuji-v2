import { Card, Divider, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RoutingStepDetails } from '@x-fuji/sdk';
import Image from 'next/image';
import React from 'react';

import RoutesSteps from '../RoutesSteps';
import AssetsContainer from './AssetsContainer';

function RouteBox({
  steps,
  isCrossChain,
}: {
  steps: RoutingStepDetails[];
  isCrossChain: boolean;
}) {
  const { palette } = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: palette.secondary.light,
        m: '0.5rem 0 1rem 0',
        width: '100%',
        borderRadius: '0.5rem !important',
      }}
    >
      <Stack
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="small">Route</Typography>

        {isCrossChain && (
          <Stack direction="row" alignItems="center">
            <Typography variant="small">via</Typography>
            <Image
              src="/assets/images/logo/connext-title.svg"
              height={16}
              width={95}
              alt="Connext logo"
            />
          </Stack>
        )}
      </Stack>

      <Divider sx={{ m: '0.75rem 0 1rem 0', height: '1px', width: '100%' }} />

      <AssetsContainer steps={steps} />

      <RoutesSteps steps={steps} />
    </Card>
  );
}

export default RouteBox;
