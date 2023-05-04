import CircleIcon from '@mui/icons-material/Circle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';

import { addressUrl, hexToChainId } from '../../../helpers/chains';
import { HistoryEntry, HistoryEntryStatus } from '../../../helpers/history';
import { useAuth } from '../../../store/auth.store';
import { useHistory } from '../../../store/history.store';
import HistoryItem from './HistoryItem';

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

  const hexChainId = useAuth((state) => state.chain?.id);
  const walletName = useAuth((state) => state.walletName);
  const logout = useAuth((state) => state.logout);

  const historyEntries = useHistory((state) =>
    state.transactions
      .map((tx) => state.entries[tx.hash])
      .filter((e) => e.address === address)
      .slice(0, 10)
  );
  const openModal = useHistory((state) => state.openModal);
  const clearAll = useHistory((state) => state.clearAll);

  const [copied, setCopied] = useState(false);
  const [copyAddressHovered, setCopyAddressHovered] = useState(false);
  const [viewOnExplorerHovered, setViewOnExplorerHovered] = useState(false);

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
    openModal(entry.hash, true);
    closeAccountModal();
  };

  const handleClear = () => {
    clearAll(address);
  };

  const onLogout = () => {
    logout();
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
        <CardContent sx={{ width: '360px', p: 0, pb: '0 !important' }}>
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
                <Typography variant="xsmallLink" onClick={handleClear}>
                  clear all
                </Typography>
              )}
          </Stack>

          <List sx={{ pb: '.75rem' }}>
            {historyEntries?.length ? (
              historyEntries.map((e) => (
                <HistoryItem
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
