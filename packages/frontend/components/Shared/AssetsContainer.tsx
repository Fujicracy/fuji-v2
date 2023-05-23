import { Stack, Typography } from '@mui/material';
import { RoutingStep, RoutingStepDetails } from '@x-fuji/sdk';
import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import React from 'react';

import { chainName } from '../../helpers/chains';
import { toNotSoFixed } from '../../helpers/values';
import { CurrencyIcon, NetworkIcon } from './Icons';

const routingSteps = [
  RoutingStep.DEPOSIT,
  RoutingStep.WITHDRAW,
  RoutingStep.BORROW,
  RoutingStep.PAYBACK,
];

const labels = {
  [RoutingStep.DEPOSIT]: 'From',
  [RoutingStep.WITHDRAW]: 'From',
  [RoutingStep.BORROW]: 'Receive on',
  [RoutingStep.PAYBACK]: 'From',
};

function AssetsContainer({ steps }: { steps: RoutingStepDetails[] }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'start', sm: 'center' }}
      justifyContent="space-between"
      width="100%"
    >
      {steps
        .filter((step) => routingSteps.includes(step.step))
        .map((step) => (
          <AssetBox key={step.step} step={step} steps={steps} />
        ))}
    </Stack>
  );
}

function AssetBox({
  step,
  steps,
}: {
  step: RoutingStepDetails;
  steps: RoutingStepDetails[];
}) {
  const chainId = [RoutingStep.BORROW, RoutingStep.PAYBACK].includes(step.step)
    ? steps[steps.length - 1].chainId
    : step.chainId;

  const label = [RoutingStep.DEPOSIT, RoutingStep.PAYBACK].includes(step.step)
    ? 'From'
    : 'Receive on';

  return (
    <Stack
      width={{ xs: '100%', sm: '50%' }}
      flexDirection="row"
      alignItems="start"
      justifyContent="start"
      gap={0}
      mb={2}
    >
      <CurrencyIcon currency={step.token || ''} height={32} width={32} />
      <Stack
        flexDirection="column"
        alignItems="start"
        justifyContent="start"
        ml={1}
        gap={0.75}
      >
        <Typography variant="h5">
          {`${toNotSoFixed(
            formatUnits(
              step.amount ?? BigNumber.from('0'),
              step.token?.decimals ?? 18
            ),
            true
          )} ${step.token?.symbol}`}
        </Typography>
        <Stack flexDirection="row" alignItems="center">
          <Typography variant="xsmallDark" mr={0.5}>
            {label}
          </Typography>
          <NetworkIcon network={chainId} height={16} width={16} />
          <Typography variant="xsmall" ml={0.5}>
            {chainName(chainId)}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default AssetsContainer;
