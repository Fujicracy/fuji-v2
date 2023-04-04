import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Card,
  Dialog,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RoutingStep, RoutingStepDetails, Token } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';
import Image from 'next/image';

import { AssetChange } from '../../helpers/assets';
import { chainName } from '../../helpers/chains';
import { RouteMeta } from '../../helpers/routing';
import { camelize, formatValue, toNotSoFixed } from '../../helpers/values';
import { useBorrow } from '../../store/borrow.store';
import { NetworkIcon } from './Icons';
import TokenIcon from './Icons/TokenIcon';

type ConfirmTransactionModalProps = {
  collateral: AssetChange;
  debt: AssetChange;
  open: boolean;
  onClose: () => void;
};

export function ConfirmTransactionModal({
  collateral,
  debt,
  open,
  onClose,
}: ConfirmTransactionModalProps) {
  const { palette } = useTheme();
  const availableRoutes = useBorrow((state) => state.availableRoutes);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          maxWidth: '35rem',
        },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          maxWidth: '35rem',
          p: { xs: '1rem', sm: '1.5rem' },
          textAlign: 'center',
        }}
      >
        <CloseIcon
          sx={{
            cursor: 'pointer',
            position: 'absolute',
            right: '3%',
          }}
          onClick={onClose}
        />
        <Typography variant="h5" color={palette.text.primary}>
          Confirm Transaction
        </Typography>

        <AssetBox
          type="collateral"
          token={collateral.token}
          value={collateral.input || '0'}
        />

        <AssetBox type="debt" token={debt.token} value={debt.input || '0'} />

        <RouteBox route={availableRoutes[0]} />

        <Button
          variant="gradient"
          size="medium"
          fullWidth
          onClick={() => console.log('test')}
          data-cy="new-borrow-redirect"
          sx={{
            mt: '1.375rem',
          }}
        >
          Confirm
        </Button>
      </Paper>
    </Dialog>
  );
}

function AssetBox({
  type,
  token,
  value,
}: {
  type: 'debt' | 'collateral';
  token: Token;
  value: string;
}) {
  const { palette } = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: palette.secondary.light,
        mt: '1rem',
        width: '100%',
      }}
    >
      <Stack
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="small">
          {type === 'debt' ? 'Borrow' : 'Deposit Collateral'}
        </Typography>

        <Stack flexDirection="row" alignItems="center" gap={0.75}>
          <TokenIcon token={token} height={16} width={16} />
          <Typography variant="small">
            {`${formatValue(value, {
              maximumFractionDigits: 3,
            })} ${token.symbol}`}
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ m: '0.75rem 0', height: '1px', width: '100%' }} />

      <Stack
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="small">Network</Typography>

        <Stack flexDirection="row" alignItems="center" gap={0.75}>
          <NetworkIcon network={token.chainId} height={16} width={16} />
          <Typography variant="small">{chainName(token.chainId)}</Typography>
        </Stack>
      </Stack>

      <Typography
        textAlign="start"
        mt=".5rem"
        variant="xsmall"
        sx={{ width: '60%' }}
      >
        The designated network where your debt position will be on.
      </Typography>
    </Card>
  );
}

function RouteBox({ route }: { route: RouteMeta }) {
  const { palette } = useTheme();

  const steps = route.steps.filter(
    (s) => s.step !== RoutingStep.START && s.step !== RoutingStep.END
  );

  function description(step: RoutingStepDetails) {
    if (step.lendingProvider) {
      const preposition = step.step === RoutingStep.DEPOSIT ? 'to' : 'from';
      return (
        <Typography
          align="center"
          variant="xsmall"
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
          <Typography align="center" variant="xsmall">
            from
          </Typography>
          <NetworkIcon
            network={chainName(step.token?.chainId)}
            height={14}
            width={14}
          />
          <Typography align="center" variant="xsmall">
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

  function textForStep({ step, amount, token, chainId }: RoutingStepDetails) {
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
        mt: '1rem',
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

        <Typography variant="small">via Connext Network</Typography>
      </Stack>

      <Divider sx={{ m: '0.75rem 0', height: '1px', width: '100%' }} />

      <Stack
        width="100%"
        justifyContent="space-between"
        sx={{
          flex: 1,
          maxWidth: '30rem',
          flexWrap: 'wrap',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: { xs: 'center', sm: 'space-between' },
          gap: '0.5rem',
        }}
      >
        {steps.map((step, i) => (
          <>
            {i !== 0 && (
              <Box
                sx={{
                  ['@media screen and (max-width: 600px)']: {
                    transform: 'rotate(90deg)',
                  },
                }}
              >
                <Image
                  alt="Arrow icon"
                  src="/assets/images/shared/doubleArrow.svg"
                  height={10}
                  width={6}
                />
              </Box>
            )}
            <Stack
              key={i}
              direction="column"
              sx={{
                p: '0.375rem 0.75rem',
                backgroundColor: '#35353B',
                borderRadius: '6px',
                minWidth: '8rem',
                flex: 1,
                width: { xs: '100%', sm: 'unset' },
              }}
            >
              <Typography align="left" variant="xsmall">
                {textForStep(step)}
              </Typography>
              <Typography align="left" variant="xsmall" mt={0.5}>
                {description(step)}
              </Typography>
            </Stack>
          </>
        ))}
      </Stack>
    </Card>
  );
}

export default ConfirmTransactionModal;
