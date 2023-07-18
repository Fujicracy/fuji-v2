import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  capitalize,
  CircularProgress,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RoutingStep, VaultType } from '@x-fuji/sdk';

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

  const commonListActionStyle = { marginTop: '0.25rem' };
  const listAction =
    entry.status === HistoryEntryStatus.ONGOING ? (
      <CircularProgress size={16} sx={commonListActionStyle} />
    ) : entry.status === HistoryEntryStatus.FAILURE ? (
      <ErrorOutlineIcon sx={{ ...commonListActionStyle, mr: '-2px' }} />
    ) : (
      <CheckIcon
        sx={{
          ...commonListActionStyle,
          backgroundColor: palette.success.dark,
          borderRadius: '100%',
          padding: '0.2rem',
        }}
        fontSize="small"
      />
    );

  const stepTitle = (step: HistoryRoutingStep) =>
    step.token
      ? `${step.step.toString()} ${formatAssetWithSymbol({
          amount: step.amount,
          decimals: step.token.decimals,
          symbol: step.token.symbol,
        })}`
      : '';

  const firstTitle = firstStep && stepTitle(firstStep);

  const secondTitle = secondStep && stepTitle(secondStep);

  const connector = firstTitle && secondTitle ? ' and ' : '';

  const title =
    type === VaultType.BORROW
      ? firstTitle + connector + secondTitle
      : firstTitle;

  const capitalizedTitle = capitalize(title ?? '');

  return (
    <ListItemButton
      sx={{
        px: '1.25rem',
        py: '.25rem',
        '& .MuiListItemSecondaryAction-root': { right: 0 },
      }}
      onClick={onClick}
    >
      <ListItem secondaryAction={listAction} sx={{ p: 0 }}>
        <ListItemText sx={{ m: 0 }}>
          <Typography sx={{ paddingRight: '1rem' }} variant="xsmall">
            {capitalizedTitle}
          </Typography>
        </ListItemText>
      </ListItem>
    </ListItemButton>
  );
}

export default HistoryItem;
