import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Chip, Collapse, Paper, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Stack } from '@mui/system';
import { RoutingStep, RoutingStepDetails } from '@x-fuji/sdk';
import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';

import { chainName } from '../../../helpers/chains';
import { RouteMeta } from '../../../helpers/routing';
import { stringifiedBridgeFeeSum } from '../../../helpers/transactions';
import { camelize, toNotSoFixed } from '../../../helpers/values';
import {
  CurrencyIcon,
  CurrencyWithNetworkIcon,
  NetworkIcon,
  ProviderIcon,
} from '../../Shared/Icons';

type RouteCardProps = {
  route: RouteMeta;
  isEditing: boolean;
  selected: boolean;
  onChange: () => void;
};

function RouteCard({ route, isEditing, selected, onChange }: RouteCardProps) {
  const { palette } = useTheme();
  const bridgeStep = route.steps.find((s) => s.step === RoutingStep.X_TRANSFER);
  const startStep = route.steps.find((s) => s.step === RoutingStep.START);
  const endStep = route.steps.find((s) => s.step === RoutingStep.END);

  const steps = route.steps.filter(
    (s) => s.step !== RoutingStep.START && s.step !== RoutingStep.END
  );

  const isMock =
    steps.filter((s) => s.amount && s.amount.gt(0) && s.step !== 'bridge')
      .length < (isEditing ? 1 : 2);

  function iconForStep(step: RoutingStepDetails) {
    if (step.step === RoutingStep.X_TRANSFER) {
      return (
        <NetworkIcon
          network={chainName(step.token?.chainId)}
          height={18}
          width={18}
        />
      );
    } else if (step.token) {
      return <CurrencyIcon currency={step.token} height={18} width={18} />;
    }
    return <></>;
  }

  function textForStep({
    step,
    amount,
    token,
    lendingProvider,
  }: RoutingStepDetails) {
    switch (step) {
      case RoutingStep.DEPOSIT:
      case RoutingStep.BORROW:
      case RoutingStep.PAYBACK:
      case RoutingStep.WITHDRAW:
        return (
          <>
            {camelize(
              `${step.toString()} ${
                isMock
                  ? ''
                  : toNotSoFixed(
                      formatUnits(amount ?? 0, token?.decimals || 18)
                    )
              } ${token?.symbol}`
            )}
            {lendingProvider && (
              <>
                {' to '}
                <ProviderIcon
                  style={{ verticalAlign: 'middle' }}
                  provider={lendingProvider.name}
                  height={14}
                  width={14}
                />
                {` ${lendingProvider?.name}`}
              </>
            )}
          </>
        );
      case RoutingStep.X_TRANSFER:
        return camelize(
          `${step.toString()} to ${chainName(token?.chainId)} via Connext`
        );
      default:
        return camelize(step);
    }
  }

  function slippageText() {
    if (!bridgeStep) return '';
    const bridgeIndex = steps.indexOf(bridgeStep);
    const step =
      bridgeIndex === 0 ? steps[bridgeIndex + 1] : steps[bridgeIndex - 1];

    return ` On ${camelize(step.step)}`;
  }

  function slippageTextTooltip() {
    if (!bridgeStep || !route.estimateSlippage) return '';
    const bridgeIndex = steps.indexOf(bridgeStep);
    const step =
      bridgeIndex === 0 ? steps[bridgeIndex + 1] : steps[bridgeIndex - 1];
    const slippage = route.estimateSlippage;
    const direction = slippage >= 0 ? 'less' : 'more';
    const sign = slippage < 0 ? 'positive' : 'negative';

    return `You are expected to ${step.step} ~${Math.abs(slippage).toFixed(
      2
    )}% ${direction}
      than the requested amount due to a ${sign} slippage.`;
  }

  function roundStepAmount(step: RoutingStepDetails | undefined) {
    if (!step) return 0;
    const formatted = formatUnits(
      step.amount ?? BigNumber.from('0'),
      step.token?.decimals ?? 18
    );
    return toNotSoFixed(formatted);
  }

  function renderHeader() {
    return (
      <Stack direction="row" justifyContent="space-between" flexWrap="wrap">
        <Stack direction="row" gap="0.5rem">
          {bridgeStep && route.bridgeFees && !isMock && (
            <>
              <Chip
                variant="routing"
                label={`Est Processing Time ~${route.estimateTime / 60} Mins`}
              />
              <Tooltip
                arrow
                title={<span>0.05% from the bridged amount</span>}
                placement="top"
              >
                <Chip
                  icon={
                    <InfoOutlinedIcon
                      sx={{ fontSize: '1rem', color: palette.info.main }}
                    />
                  }
                  variant="routing"
                  label={`Bridge Fee ~$${stringifiedBridgeFeeSum(
                    route.bridgeFees
                  )}`}
                />
              </Tooltip>
            </>
          )}
          {bridgeStep && !isMock && route.estimateSlippage !== undefined && (
            <>
              <Tooltip
                arrow
                title={<span>{slippageTextTooltip()}</span>}
                placement="top"
              >
                <Chip
                  icon={
                    <InfoOutlinedIcon
                      sx={{ fontSize: '1rem', color: palette.info.main }}
                    />
                  }
                  variant="routing"
                  label={
                    <>
                      Price Impact{slippageText()}:{' '}
                      <span
                        style={{
                          color:
                            route.estimateSlippage < 0
                              ? palette.success.main
                              : palette.error.main,
                        }}
                      >
                        {`${(-route.estimateSlippage).toFixed(2)}%`}
                      </span>
                    </>
                  }
                />
              </Tooltip>
            </>
          )}
        </Stack>

        <Chip
          variant={selected ? 'selected' : 'routing'}
          label={selected ? 'Selected' : 'Click To Select'}
        />
      </Stack>
    );
  }

  function renderStep(
    step: RoutingStepDetails,
    index: number,
    maxWidth: string
  ) {
    return (
      <Stack key={index} direction="column" alignItems="center">
        {iconForStep(step)}
        <Typography
          m="0.375rem"
          align="center"
          variant="xsmall"
          sx={{ maxWidth }}
        >
          {textForStep(step)}
        </Typography>
      </Stack>
    );
  }

  return (
    <Paper
      sx={{
        border: `2px solid ${
          selected ? palette.primary.main : palette.secondary.light
        }`,
        p: `${route.recommended ? '0' : '1.5rem'} 1.5rem 0 1.5rem`,
        marginTop: '1rem',
        cursor: 'pointer',
        background: palette.secondary.dark,
      }}
      onClick={onChange}
    >
      {route.recommended && <Chip variant="recommended" label="Recommended" />}
      {renderHeader()}
      <Stack mt="1rem" direction="row" justifyContent="space-between">
        <Stack direction="row">
          {startStep && startStep.token && (
            <CurrencyWithNetworkIcon
              currency={startStep.token}
              network={chainName(startStep?.chainId)}
            />
          )}
          <Box>
            <Typography variant="body">
              {`${isMock ? '' : roundStepAmount(startStep)} ${
                startStep?.token?.symbol
              }`}
            </Typography>
            <br />
            <Typography variant="xsmall">
              from {chainName(startStep?.chainId)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row">
          <Box textAlign="right" mr="0.75rem">
            <Typography variant="body">
              {`Get ${isMock ? '' : roundStepAmount(endStep)} ${
                endStep?.token?.symbol
              }`}
            </Typography>
            <br />
            <Typography variant="xsmall">
              on {chainName(endStep?.chainId)}
            </Typography>
          </Box>

          {endStep && endStep.token && (
            <CurrencyWithNetworkIcon
              currency={endStep.token}
              network={chainName(endStep?.chainId)}
            />
          )}
        </Stack>
      </Stack>

      {!selected && (
        <Collapse sx={{ maxHeight: '2.5rem' }} in={!selected}>
          <Box
            sx={{
              position: 'relative',
              width: '50%',
              bottom: '1.8rem',
              left: '25%',
              backgroundImage: 'url("./assets/images/utils/single-route.svg")',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                bottom: '.3rem',
              }}
            >
              {bridgeStep ? (
                <Stack direction="column" alignItems="center">
                  {renderStep(bridgeStep, 0, '9rem')}
                </Stack>
              ) : (
                <Stack direction="row" justifyContent="space-around">
                  {steps.map((step, i) => renderStep(step, i, '6.5rem'))}
                </Stack>
              )}
            </Box>
          </Box>
        </Collapse>
      )}

      <Collapse in={selected}>
        <Box
          m="0.5rem 1.7rem 1.5rem 0.8rem"
          sx={{
            backgroundImage: "url('/assets/images/utils/multiple-routes.svg')",
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              top: '1.3rem',
            }}
          >
            <Stack direction="row" justifyContent="space-around">
              {steps.map((step, i) => renderStep(step, i, '6.5rem'))}
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}

export default RouteCard;
