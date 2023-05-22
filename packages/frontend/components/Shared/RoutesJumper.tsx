import { Stack, Typography } from '@mui/material';
import { RoutingStep, RoutingStepDetails } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';
import React from 'react';

import { chainName } from '../../helpers/chains';
import { camelize, toNotSoFixed } from '../../helpers/values';
import { NetworkIcon } from './Icons';

function RoutesJumper({ steps }: { steps: RoutingStepDetails[] }) {
  const stepsToShow = steps.filter(
    (s) => s.step !== RoutingStep.START && s.step !== RoutingStep.END
  );

  function description(step: RoutingStepDetails) {
    if (step.lendingProvider) {
      const withToPrepositions = [RoutingStep.DEPOSIT, RoutingStep.PAYBACK];
      const preposition = withToPrepositions.includes(step.step)
        ? 'to'
        : 'from';
      return (
        <span
          style={{
            display: 'inline',
            gap: '0.25rem',
            marginLeft: '0.25rem',
            alignItems: 'center',
          }}
        >
          {`${preposition} ${step.lendingProvider.name} on `}
          <NetworkIcon
            network={chainName(step.chainId)}
            height={14}
            width={14}
            style={{ margin: '0 0.25rem -0.15rem 0', alignSelf: 'center' }}
          />
        </span>
      );
    }
    if (step.step === RoutingStep.X_TRANSFER) {
      return (
        <span
          style={{
            display: 'inline',
            gap: '0.25rem',
            marginLeft: '0.25rem',
            textAlign: 'center',
          }}
        >
          from
          <NetworkIcon
            network={chainName(step.chainId)}
            height={14}
            width={14}
            style={{
              margin: '0 0.25rem -0.15rem 0.25rem',
              alignSelf: 'center',
            }}
          />
          to
          <NetworkIcon
            network={chainName(step.token?.chainId)}
            height={14}
            width={14}
            style={{
              margin: '0 0.25rem -0.15rem 0.25rem',
              alignSelf: 'center',
            }}
          />
        </span>
      );
    }

    return <></>;
  }

  function textForStep({ step, amount, token }: RoutingStepDetails) {
    switch (step) {
      case RoutingStep.DEPOSIT:
      case RoutingStep.BORROW:
      case RoutingStep.PAYBACK:
      case RoutingStep.WITHDRAW:
        return camelize(
          `${step.toString()} ${toNotSoFixed(
            formatUnits(amount ?? 0, token?.decimals || 18),
            true
          )} ${token?.symbol}`
        );
      case RoutingStep.X_TRANSFER:
        return camelize(
          `${step.toString()} ${toNotSoFixed(
            formatUnits(amount ?? 0, token?.decimals || 18)
          )} ${token?.symbol}`
        );
      default:
        return camelize(step);
    }
  }

  return (
    <>
      {stepsToShow.map((step, index) => {
        return (
          <Stack
            key={index}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
            mt={1}
          >
            <Stack direction="row" alignItems="center">
              <NetworkIcon
                network={chainName(step.chainId)}
                height={18}
                width={18}
              />
              <Typography
                variant="small"
                sx={{
                  ml: '0.5rem',
                }}
              >
                {textForStep(step)}
                {description(step)}
              </Typography>
            </Stack>
          </Stack>
        );
      })}
    </>
  );
}
