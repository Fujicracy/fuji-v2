import { Stack, Typography } from '@mui/material';
import { RoutingStep, RoutingStepDetails } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';
import Image from 'next/image';
import React from 'react';

import { chainName } from '../../helpers/chains';
import { camelize, toNotSoFixed } from '../../helpers/values';
import { NetworkIcon } from './Icons';

function RoutesJumper({ steps }: { steps: RoutingStepDetails[] }) {
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

  function amountText({ step, amount, token }: RoutingStepDetails) {
    const amountStr = `${toNotSoFixed(
      formatUnits(amount ?? 0, token?.decimals || 18),
      true
    )} ${token?.symbol}`;
    switch (step) {
      case RoutingStep.X_TRANSFER:
        return `${amountStr} -> ${amountStr}`;
      case RoutingStep.DEPOSIT:
      case RoutingStep.BORROW:
      case RoutingStep.PAYBACK:
      case RoutingStep.WITHDRAW:
        return amountStr;
      default:
        return '0';
    }
  }

  function stepIcon({ step, chainId }: RoutingStepDetails) {
    if (step === RoutingStep.X_TRANSFER) {
      return (
        <Image
          src="/assets/images/logo/connext.svg"
          height={18}
          width={18}
          alt="Connext icon"
        />
      );
    }

    return <NetworkIcon network={chainName(chainId)} height={18} width={18} />;
  }

  return (
    <>
      {stepsToShow.map((step, index) => {
        return (
          <Stack
            key={index}
            direction="row"
            justifyContent="space-between"
            gap={2}
            mt={1}
          >
            <Stack direction="row" alignItems="start">
              {stepIcon(step)}
              <Stack
                alignItems="start"
                sx={{
                  ml: '0.5rem',
                }}
              >
                <Typography variant="xsmall">{textForStep(step)}</Typography>
                <Typography
                  variant="xsmallDark"
                  sx={{
                    display: 'block',
                  }}
                >
                  {amountText(step)}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        );
      })}
    </>
  );
}

export default RoutesJumper;
