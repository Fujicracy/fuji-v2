import { Stack, Typography, useTheme } from '@mui/material';
import { RoutingStep, RoutingStepDetails } from '@x-fuji/sdk';
import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import Image from 'next/image';
import React from 'react';

import { chainName } from '../../helpers/chains';
import { camelize, toNotSoFixed } from '../../helpers/values';
import { NetworkIcon } from './Icons';

function RoutesSteps({ steps }: { steps: RoutingStepDetails[] }) {
  const { palette } = useTheme();
  const stepsToShow = steps.filter(
    (s) => s.step !== RoutingStep.START && s.step !== RoutingStep.END
  );

  function textForStep(step: RoutingStepDetails) {
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
            alignItems: 'center',
          }}
        >
          {`${camelize(step.step.toString())} ${preposition} ${
            step.lendingProvider.name
          } on ${chainName(step.chainId)}`}
        </span>
      );
    }
    if (step.step === RoutingStep.X_TRANSFER) {
      return (
        <span
          style={{
            display: 'inline',
            gap: '0.25rem',
            textAlign: 'center',
          }}
        >
          {camelize(step.step.toString())} from {chainName(step.chainId)} to{' '}
          {chainName(step.token?.chainId)}
        </span>
      );
    }

    return <></>;
  }

  function amountText({
    step,
    index,
  }: {
    step: RoutingStepDetails;
    index: number;
  }) {
    const formatted = (value?: BigNumber) =>
      `${toNotSoFixed(
        formatUnits(value ?? 0, step.token?.decimals || 18),
        true
      )} ${step.token?.symbol}`;
    const amountStr = formatted(step.amount);
    switch (step.step) {
      case RoutingStep.X_TRANSFER:
        return `${amountStr} -> ${formatted(steps[index + 1]?.amount)}`;
      case RoutingStep.DEPOSIT:
      case RoutingStep.BORROW:
      case RoutingStep.PAYBACK:
      case RoutingStep.WITHDRAW:
        return amountStr;
      default:
        return '0';
    }
  }

  return (
    <>
      {stepsToShow.map((step, index) => {
        return (
          <Stack
            key={index}
            direction="row"
            alignItems="start"
            justifyContent="space-between"
            gap={2}
            mt={1}
            sx={{
              position: 'relative',
              '&:not(:last-of-type):after': {
                position: 'absolute',
                content: '""',
                borderLeft: `1px solid #47494C`,
                height: '100%',
                transform: 'translateY(25%)',
                left: '5%',
                zIndex: 1,
              },
            }}
          >
            <Stack
              direction="row"
              alignItems="start"
              justifyContent="start"
              sx={{ zIndex: 2 }}
            >
              <Stack
                alignItems="center"
                justifyContent="center"
                width={20}
                height={20}
                sx={{ backgroundColor: '#47494C', borderRadius: '100px' }}
              >
                {stepIcon(step)}
              </Stack>
              <Stack
                alignItems="start"
                sx={{
                  ml: '0.5rem',
                  textAlign: 'left',
                }}
              >
                <Typography variant="xsmall">{textForStep(step)}</Typography>
                <Typography
                  variant="xsmallDark"
                  color={palette.info.main}
                  sx={{
                    display: 'block',
                  }}
                >
                  {amountText({ step, index })}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        );
      })}
    </>
  );
}

export function stepIcon({ step, chainId }: RoutingStepDetails) {
  if (step === RoutingStep.X_TRANSFER) {
    return (
      <Image
        src="/assets/images/logo/connext.svg"
        height={16}
        width={16}
        alt="Connext icon"
      />
    );
  }

  return <NetworkIcon network={chainName(chainId)} height={16} width={16} />;
}

export default RoutesSteps;
