import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import {
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import { ReactNode, useEffect, useState } from 'react';

import { TabOption } from '../../../../constants';
import {
  didShowBalanceWarning,
  setBalanceWarningShown,
} from '../../../../helpers/auth';
import { fetchXBalances } from '../../../../helpers/balances';
import { addressUrl } from '../../../../helpers/chains';
import { HistoryEntry } from '../../../../helpers/history';
import {
  NotificationDuration,
  notify,
} from '../../../../helpers/notifications';
import { useAuth } from '../../../../store/auth.store';
import { useHistory } from '../../../../store/history.store';
import TabSwitch from '../../../Shared/TabSwitch/TabSwitch';
import BalanceItem from './BalanceItem';
import HistoryItem from './HistoryItem';

type AccountModalProps = {
  isOpen: boolean;
  anchorEl?: HTMLElement | null;
  address: string;
  closeAccountModal: () => void;
};

const tabOptions: TabOption[] = [
  { value: 0, label: 'Assets' },
  { value: 1, label: 'Activity' },
];

function AccountModal({
  isOpen,
  anchorEl,
  address,
  closeAccountModal,
}: AccountModalProps) {
  const { palette } = useTheme();

  const chainId = useAuth((state) => state.chainId);
  const xBalances = useAuth((state) => state.xBalances);
  const changeXBalances = useAuth((state) => state.changeXBalances);
  const logout = useAuth((state) => state.logout);

  const historyEntries = useHistory((state) =>
    state.transactions
      .map((tx) => state.entries[tx.hash])
      .filter((e) => e.address === address)
      .slice(0, 10)
  );
  const openModal = useHistory((state) => state.openModal);

  const formattedAddress =
    address.substring(0, 8) + '...' + address.substring(address.length - 4);

  const [currentTab, setCurrentTab] = useState(0);
  const handleTabChange = (newValue: number) => {
    setCurrentTab(newValue);
  };

  useEffect(() => {
    if (isOpen) {
      (async () => {
        const result = await fetchXBalances();
        changeXBalances(result);
      })();
    }
  }, [isOpen, changeXBalances]);

  const copy = () => {
    navigator.clipboard.writeText(address);

    setTimeout(() => {
      notify({
        type: 'success',
        message: 'Address Copied!',
        duration: NotificationDuration.SHORT,
      });
    }, 1000);
  };

  const handleEntryClick = (entry: HistoryEntry) => {
    openModal(entry.hash, true);
    closeAccountModal();
  };

  const onLogout = () => {
    logout();
    closeAccountModal();
  };

  return (
    <Popover
      open={isOpen}
      onClose={closeAccountModal}
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      PaperProps={{ sx: { background: 'transparent', padding: 0 } }}
    >
      <Card sx={{ border: `1px solid ${palette.secondary.light}`, mt: 1 }}>
        <CardContent
          sx={{
            width: '360px',
            p: 0,
            pb: '0 !important',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            p="1.5rem 1.25rem 0.625rem 1.25rem"
          >
            <Stack direction="row" alignItems="center" gap=".5rem">
              <Image
                src={'/assets/images/shared/account.svg'}
                alt="account icon"
                width={32}
                height={32}
              />
              <Typography variant="body">{formattedAddress}</Typography>
            </Stack>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="flex-end"
            >
              <AccountActionButton action={copy}>
                <ContentCopyIcon
                  fontSize="small"
                  sx={{ fontSize: '1rem', color: palette.info.main }}
                />
              </AccountActionButton>
              <AccountActionButton
                action={() => {
                  window &&
                    window
                      .open(addressUrl(address, chainId), '_blank')
                      ?.focus();
                }}
              >
                <LaunchIcon
                  sx={{ color: palette.info.main, fontSize: '1rem' }}
                />
              </AccountActionButton>
              <AccountActionButton
                action={onLogout}
                data-cy="header-disconnect"
              >
                <LogoutOutlinedIcon
                  sx={{ color: palette.info.main, fontSize: '1rem' }}
                />
              </AccountActionButton>
            </Stack>
          </Stack>

          <Box sx={{ p: '1rem 1rem 0 1rem' }}>
            <TabSwitch
              options={tabOptions}
              selected={currentTab}
              onChange={handleTabChange}
            />
          </Box>

          <List sx={{ pb: '.75rem' }}>
            {currentTab === 0 ? (
              <>
                {!didShowBalanceWarning && (
                  <>
                    <Typography>
                      Displays only the assets available for lending and
                      borrowing on Fuji
                    </Typography>
                    <Button
                      onClick={() => {
                        setBalanceWarningShown();
                      }}
                    >
                      Close
                    </Button>
                  </>
                )}
                {xBalances?.map((b) => (
                  <BalanceItem
                    key={`${b.currency.chainId}-${b.currency.symbol}`}
                    balance={b}
                  />
                ))}
              </>
            ) : historyEntries?.length ? (
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

function AccountActionButton({
  action,
  children,
}: {
  children: ReactNode;
  action: () => void;
}) {
  const { palette } = useTheme();

  return (
    <Box
      onClick={action}
      sx={{
        width: '2rem',
        height: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderRadius: '50%',
        border: '1px solid #2A2E35',
        cursor: 'pointer',
        '&:not(first-of-type)': {
          ml: 1,
        },
        '&:hover': {
          borderColor: palette.text.primary,
          'svg path': {
            fill: palette.text.primary,
          },
        },
      }}
    >
      {children}
    </Box>
  );
}

export default AccountModal;
