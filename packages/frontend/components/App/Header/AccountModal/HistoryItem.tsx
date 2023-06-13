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
import { RoutingStep } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';

import {
  HistoryEntry,
  HistoryEntryStatus,
  stepFromEntry,
} from '../../../../helpers/history';
import { toNotSoFixed } from '../../../../helpers/values';

type HistoryItemProps = {
  entry: HistoryEntry;
  onClick: () => void;
};

function HistoryItem({ entry, onClick }: HistoryItemProps) {
  const deposit = stepFromEntry(entry, RoutingStep.DEPOSIT);
  const borrow = stepFromEntry(entry, RoutingStep.BORROW);
  const payback = stepFromEntry(entry, RoutingStep.PAYBACK);
  const withdraw = stepFromEntry(entry, RoutingStep.WITHDRAW);

  const firstStep = deposit ?? payback;
  const secondStep = borrow ?? withdraw;

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

  const firstTitle =
    firstStep && firstStep.token
      ? `${firstStep.step.toString()} ${toNotSoFixed(
          formatUnits(firstStep.amount ?? 0, firstStep.token.decimals),
          true
        )} ${firstStep.token.symbol}`
      : '';

  const secondTitle =
    secondStep && secondStep.token
      ? `${secondStep.step.toString()} ${toNotSoFixed(
          formatUnits(secondStep.amount ?? 0, secondStep.token.decimals)
        )} ${secondStep.token.symbol}`
      : '';

  const connector = firstTitle && secondTitle ? ' and ' : '';

  const title = capitalize(firstTitle + connector + secondTitle);

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
            {title}
          </Typography>
        </ListItemText>
      </ListItem>
    </ListItemButton>
  );
}

export default HistoryItem;
