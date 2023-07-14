import { Stack, Typography } from '@mui/material';
import { ChainId, RoutingStep, RoutingStepDetails } from '@x-fuji/sdk';
import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import React from 'react';

import { chainName } from '../../../helpers/chains';
import { formatValue } from '../../../helpers/values';
import { CurrencyIcon, NetworkIcon } from '../../Shared/Icons';

const routingSteps = [
  RoutingStep.DEPOSIT,
  RoutingStep.WITHDRAW,
  RoutingStep.BORROW,
  RoutingStep.PAYBACK,
];

function AssetsContainer({ steps }: { steps: RoutingStepDetails[] }) {
  const startChainId = steps.find(
    (step) => step.step === RoutingStep.START
  )?.chainId;

  const destinationChainId = steps.find(
    (step) => step.step === RoutingStep.END
  )?.chainId;

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
          <AssetBox
            key={step.step}
            step={step}
            startChainId={startChainId}
            destinationChainId={destinationChainId}
          />
        ))}
    </Stack>
  );
}

function AssetBox({
  step,
  startChainId,
  destinationChainId,
}: {
  step: RoutingStepDetails;
  startChainId?: ChainId;
  destinationChainId?: ChainId;
}) {
  const chainId = [RoutingStep.BORROW, RoutingStep.WITHDRAW].includes(step.step)
    ? destinationChainId
    : startChainId;

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
          {`${formatValue(
            parseFloat(
              formatUnits(
                step.amount ?? BigNumber.from('0'),
                step.token?.decimals ?? 18
              )
            ),
            { maximumFractionDigits: 3 }
          )} ${step.token?.symbol}`}
        </Typography>
        <Stack flexDirection="row" alignItems="center">
          <Typography variant="xsmallDark" mr={0.5}>
            {label}
          </Typography>
          <NetworkIcon
            network={chainId || step.chainId}
            height={16}
            width={16}
          />
          <Typography variant="xsmall" ml={0.5}>
            {chainName(chainId)}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default AssetsContainer;
