import {
  Box,
  capitalize,
  CircularProgress,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RoutingStep, VaultType } from '@x-fuji/sdk';
import Image from 'next/image';

import { timeAgoFromNow } from '../../../../helpers/date';
import {
  HistoryEntry,
  HistoryEntryStatus,
  HistoryRoutingStep,
  stepFromEntry,
} from '../../../../helpers/history';
import { formatAssetWithSymbol } from '../../../../helpers/values';

type HistoryItemProps = {
  entry: HistoryEntry;
  onClick: () => void;
};

function HistoryItem({ entry, onClick }: HistoryItemProps) {
  const deposit = stepFromEntry(entry, RoutingStep.DEPOSIT);
  const borrow = stepFromEntry(entry, RoutingStep.BORROW);
  const payback = stepFromEntry(entry, RoutingStep.PAYBACK);
  const withdraw = stepFromEntry(entry, RoutingStep.WITHDRAW);

  const type = entry.type || VaultType.BORROW;

  const firstStep = deposit ?? (type === VaultType.BORROW ? payback : withdraw);
  const secondStep = borrow ?? withdraw; // There is no second step for lending

  const { palette } = useTheme();

  const commonSvgStyle = { marginLeft: 0.25 };
  const listAction =
    entry.status === HistoryEntryStatus.ONGOING ? (
      <CircularProgress size={14} />
    ) : entry.status === HistoryEntryStatus.FAILURE ? (
      <Image
        style={commonSvgStyle}
        src={'/assets/images/transactions/error.svg'}
        alt={'error icon'}
        width={16}
        height={16}
      />
    ) : payback ? (
      <Image
        style={commonSvgStyle}
        src={'/assets/images/transactions/payback.svg'}
        alt={'payback icon'}
        width={16}
        height={16}
      />
    ) : borrow || withdraw ? (
      <Image
        style={commonSvgStyle}
        src={'/assets/images/transactions/borrow.svg'}
        alt={'borrow icon'}
        width={16}
        height={16}
      />
    ) : (
      <Image
        style={commonSvgStyle}
        src={'/assets/images/transactions/deposit.svg'}
        alt={'deposit icon'}
        width={16}
        height={14}
      />
    );

  const stepTitle = (step: HistoryRoutingStep) =>
    step.token
      ? capitalize(
          `${step.step.toString()} ${formatAssetWithSymbol({
            amount: step.amount,
            decimals: step.token.decimals,
            symbol: step.token.symbol,
          })}`
        )
      : '';

  const firstTitle = firstStep && stepTitle(firstStep);

  const secondTitle = secondStep && stepTitle(secondStep);

  const connector = firstTitle && secondTitle ? ' and ' : '';

  const description =
    type === VaultType.BORROW && secondTitle
      ? firstTitle + connector + secondTitle
      : firstTitle;

  const stepLabel = capitalize(
    (secondStep && type === VaultType.BORROW
      ? firstStep?.step + connector + capitalize(secondStep?.step ?? '')
      : firstStep?.step) ?? ''
  );

  const isPending = entry.status === HistoryEntryStatus.ONGOING;
  const statusLabel = entry.status !== HistoryEntryStatus.SUCCESS && (
    <Box
      sx={{
        display: 'inline-block',
        background: isPending ? '#F5AC3733' : '#FC0A5433',
        p: '0 0.375rem',
        borderRadius: '0.375rem',
        ml: '0.25rem',
      }}
    >
      <Typography
        variant="xsmall"
        fontWeight={500}
        lineHeight="100%"
        sx={{
          p: 0,
          color: isPending ? palette.warning.main : palette.error.dark,
        }}
      >
        {isPending ? 'Pending' : 'Failed'}
      </Typography>
    </Box>
  );

  return (
    <ListItemButton
      sx={{
        mt: 1.5,
        px: '1.25rem',
        py: '.25rem',
        '& .MuiListItemSecondaryAction-root': { right: 0 },
      }}
      onClick={onClick}
    >
      <ListItem sx={{ p: 0 }}>
        <ListItemText sx={{ m: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: '100%' }}
          >
            <Stack direction="row" alignItems="center" sx={{ pr: '1rem' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: palette.secondary.main,
                }}
              >
                {listAction}
              </Box>

              <Stack
                direction="column"
                justifyContent="space-between"
                sx={{ ml: 1 }}
              >
                <Typography variant="small" fontWeight={500}>
                  {stepLabel} {statusLabel}
                </Typography>
                <Typography variant="xsmall" mt={0.5} color={palette.info.main}>
                  {description}
                </Typography>
              </Stack>
            </Stack>
            {entry?.timestamp && (
              <Typography
                variant="xsmall"
                mt={0.5}
                color={palette.info.main}
                sx={{ minWidth: '3.5rem', textAlign: 'right' }}
              >
                {timeAgoFromNow(entry.timestamp)}
              </Typography>
            )}
          </Stack>
        </ListItemText>
      </ListItem>
    </ListItemButton>
  );
}

export default HistoryItem;
