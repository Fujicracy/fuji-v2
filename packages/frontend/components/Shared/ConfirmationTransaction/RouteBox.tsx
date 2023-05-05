import { Box, Card, Divider, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RoutingStep, RoutingStepDetails } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';
import Image from 'next/image';
import React from 'react';

import { chainName } from '../../../helpers/chains';
import { camelize, toNotSoFixed } from '../../../helpers/values';
import { NetworkIcon } from '../Icons';

function RouteBox({
  steps,
  isCrossChain,
}: {
  steps: RoutingStepDetails[];
  isCrossChain: boolean;
}) {
  const { palette } = useTheme();

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
        <Typography
          align="center"
          variant="xsmall"
          fontSize="0.75rem"
          sx={{ display: 'flex', gap: '0.25rem' }}
        >
          {`${preposition} ${step.lendingProvider.name} on `}
          <NetworkIcon
            network={chainName(step.chainId)}
            height={14}
            width={14}
          />
        </Typography>
      );
    }
    if (step.step === RoutingStep.X_TRANSFER) {
      return (
        <Stack flexDirection="row" alignItems="center" gap="0.25rem">
          <Typography align="center" variant="xsmall" fontSize="0.75rem">
            from
          </Typography>
          <NetworkIcon
            network={chainName(step.token?.chainId)}
            height={14}
            width={14}
          />
          <Typography align="center" variant="xsmall" fontSize="0.75rem">
            to
          </Typography>
          <NetworkIcon
            network={chainName(step.chainId)}
            height={14}
            width={14}
          />
        </Stack>
      );
    }

    return <></>;
  }

  // TODO: formatting here since it brakes markup
  function textForStep({ step, amount, token }: RoutingStepDetails) {
    switch (step) {
      case RoutingStep.DEPOSIT:
      case RoutingStep.BORROW:
      case RoutingStep.PAYBACK:
      case RoutingStep.WITHDRAW:
        return camelize(
          `${step.toString()} ${toNotSoFixed(
            formatUnits(amount ?? 0, token?.decimals || 18)
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
    <Card
      variant="outlined"
      sx={{
        borderColor: palette.secondary.light,
        m: '0.5rem 0 1rem 0',
        width: '100%',
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
          <Typography variant="small">via Connext Network</Typography>
        )}
      </Stack>

      <Divider sx={{ m: '0.75rem 0', height: '1px', width: '100%' }} />

      <Stack
        width="100%"
        justifyContent="space-between"
        sx={{
          flex: 1,
          maxWidth: '38rem',
          flexWrap: 'wrap',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'start',
          justifyContent: 'start',
          gap: '0.5rem',
        }}
      >
        {stepsToShow.map((step, i) => (
          <Stack
            direction="row"
            alignItems="center"
            sx={{ flex: 1, width: { xs: '100%', sm: 'unset' } }}
            key={i}
          >
            <Stack
              direction="column"
              sx={{
                p: '0.375rem 0.45rem',
                backgroundColor: '#35353B',
                borderRadius: '6px',
                minWidth: {
                  xs: '95%',
                  sm: stepsToShow.length > 3 ? '13rem' : '8rem',
                },
                flex: 1,
              }}
            >
              <Typography align="left" variant="xsmall">
                {textForStep(step)}
              </Typography>
              <Typography align="left" variant="xsmall" mt={0.5}>
                {description(step)}
              </Typography>
            </Stack>
            {i !== stepsToShow.length - 1 ? (
              <Box
                sx={{
                  m: '0 0.5rem',
                  ['@media screen and (max-width: 600px)']: {
                    transform: 'rotate(90deg)',
                  },
                }}
              >
                <Image
                  alt="Arrow icon"
                  src="/assets/images/shared/doubleArrow.svg"
                  height={10}
                  width={9}
                />
              </Box>
            ) : (
              <Box sx={{ width: { xs: '1.5rem', sm: '0' } }} />
            )}
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}

export default RouteBox;
