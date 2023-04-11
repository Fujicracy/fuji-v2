import CheckIcon from '@mui/icons-material/Check';
import CircleIcon from '@mui/icons-material/Circle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import {
  Box,
  Button,
  capitalize,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RoutingStep } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';
import { useState } from 'react';

import { addressUrl, hexToChainId } from '../../helpers/chains';
import {
  HistoryEntry,
  HistoryEntryStatus,
  stepFromEntry,
} from '../../helpers/history';
import { useAuth } from '../../store/auth.store';
import { useHistory } from '../../store/history.store';

type AccountModalProps = {
  isOpen: boolean;
  anchorEl: HTMLElement | null | undefined;
  address: string;
  closeAccountModal: () => void;
};

function AccountModal({
  isOpen,
  anchorEl,
  address,
  closeAccountModal,
}: AccountModalProps) {
  const { palette } = useTheme();
  const [copied, setCopied] = useState(false);
  const [copyAddressHovered, setCopyAddressHovered] = useState(false);
  const [viewOnExplorerHovered, setViewOnExplorerHovered] = useState(false);
  const logout = useAuth((state) => state.logout);
  const hexChainId = useAuth((state) => state.chain?.id);
  const walletName = useAuth((state) => state.walletName);

  const historyEntries = useHistory((state) =>
    state.transactions.map((hash) => state.entries[hash]).slice(0, 10)
  );
  const openModal = useHistory((state) => state.openModal);
  const clearAll = useHistory((state) => state.clearAll);

  const chainId = hexToChainId(hexChainId);
  const formattedAddress =
    address.substring(0, 8) + '...' + address.substring(address.length - 4);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 5000);
  };

  const handleEntryClick = (entry: HistoryEntry) => {
    openModal(entry.hash);
    closeAccountModal();
  };

  const onLogout = () => {
    logout();
    clearAll();
  };

  return (
    <Popover
      open={isOpen}
      onClose={closeAccountModal}
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{ sx: { background: 'transparent', padding: 0 } }}
    >
      <Card sx={{ border: `1px solid ${palette.secondary.light}`, mt: 1 }}>
        <CardContent sx={{ width: '340px', p: 0, pb: '0 !important' }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            p="1.5rem 1.25rem 0.625rem 1.25rem"
          >
            <Typography variant="xsmall">
              Connected with {walletName}
            </Typography>
            <Button variant="small" onClick={onLogout}>
              Disconnect
            </Button>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            gap=".5rem"
            ml="1.25rem"
            mb=".8rem"
          >
            <CircleIcon sx={{ fontSize: '20px' }} />
            <Typography variant="body">{formattedAddress}</Typography>
          </Stack>

          <Stack direction="row" alignItems="center" gap="1.125rem" ml="1.4rem">
            <Stack
              direction="row"
              alignItems="center"
              sx={{ cursor: 'pointer' }}
              onClick={copy}
              onMouseEnter={() => setCopyAddressHovered(true)}
              onMouseLeave={() => setCopyAddressHovered(false)}
            >
              <ContentCopyIcon
                fontSize="small"
                sx={{
                  color: !copyAddressHovered
                    ? palette.info.main
                    : palette.text.primary,
                  mr: '.2rem',
                  fontSize: '1rem',
                }}
              />
              <Typography
                variant="xsmall"
                color={
                  !copyAddressHovered ? palette.info.main : palette.text.primary
                }
              >
                {!copied ? 'Copy Address' : 'Copied!'}
              </Typography>
            </Stack>

            <Box>
              <a
                href={addressUrl(chainId, address)}
                target="_blank"
                rel="noreferrer"
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  onMouseEnter={() => setViewOnExplorerHovered(true)}
                  onMouseLeave={() => setViewOnExplorerHovered(false)}
                >
                  <LaunchIcon
                    sx={{
                      color: viewOnExplorerHovered
                        ? palette.text.primary
                        : palette.info.main,
                      mr: '.2rem',
                      fontSize: '1rem',
                    }}
                  />
                  <Typography
                    variant="xsmall"
                    color={
                      viewOnExplorerHovered
                        ? palette.text.primary
                        : palette.info.main
                    }
                  >
                    View on Explorer
                  </Typography>
                </Stack>
              </a>
            </Box>
          </Stack>

          <Divider
            sx={{
              m: '1rem 1.25rem .75rem 1.25rem',
              background: palette.secondary.light,
            }}
          />

          <Stack direction="row" justifyContent="space-between" mx="1.25rem">
            <Typography variant="xsmall">Recent Transactions</Typography>
            {historyEntries.length > 0 &&
              historyEntries.filter(
                (entry) => entry.status === HistoryEntryStatus.ONGOING
              ).length !== historyEntries.length && (
                <Typography variant="xsmallLink" onClick={clearAll}>
                  clear all
                </Typography>
              )}
          </Stack>

          <List sx={{ pb: '.75rem' }}>
            {historyEntries?.length ? (
              historyEntries.map((e) => (
                <BorrowEntry
                  key={e.hash}
                  entry={e}
                  onClick={() => handleEntryClick(e)}
                />
              ))
            ) : (
              <ListItem sx={{ px: '1.25rem' }}>
                <Typography variant="xsmallDark">
                  Your recent transaction history will appear here.
                </Typography>
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>
    </Popover>
  );
}

export default AccountModal;

type BorrowEntryProps = {
  entry: HistoryEntry;
  onClick: () => void;
};

function BorrowEntry({ entry, onClick }: BorrowEntryProps) {
  const deposit = stepFromEntry(entry, RoutingStep.DEPOSIT);
  const borrow = stepFromEntry(entry, RoutingStep.BORROW);
  const payback = stepFromEntry(entry, RoutingStep.PAYBACK);
  const withdraw = stepFromEntry(entry, RoutingStep.WITHDRAW);

  const firstStep = deposit ?? payback;
  const secondStep = borrow ?? withdraw;

  const { palette } = useTheme();

  const listAction =
    entry.status === HistoryEntryStatus.ONGOING ? (
      <CircularProgress size={16} sx={{ mr: '-1rem' }} />
    ) : entry.status === HistoryEntryStatus.FAILURE ? (
      <ErrorOutlineIcon />
    ) : (
      <CheckIcon
        sx={{
          backgroundColor: palette.success.dark,
          borderRadius: '100%',
          padding: '0.2rem',
        }}
        fontSize="small"
      />
    );

  const firstTitle =
    firstStep && firstStep.token
      ? `${firstStep.step.toString()} ${formatUnits(
          firstStep.amount ?? 0,
          firstStep.token.decimals
        )} ${firstStep.token.symbol}`
      : '';

  const secondTitle =
    secondStep && secondStep.token
      ? `${secondStep.step.toString()} ${formatUnits(
          secondStep.amount ?? 0,
          secondStep.token.decimals
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
          <Typography variant="xsmall">{title}</Typography>
        </ListItemText>
      </ListItem>
    </ListItemButton>
  );
}
