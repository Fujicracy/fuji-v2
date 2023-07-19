import {
  Box,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { VaultType } from '@x-fuji/sdk';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React from 'react';

import { showPosition } from '../../../helpers/navigation';
import { useAuth } from '../../../store/auth.store';
import { BorrowingPosition } from '../../../store/models/Position';
import { usePositions } from '../../../store/positions.store';

function StatusChip() {
  const { palette } = useTheme();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);

  const walletChainId = useAuth((state) => state.chainId);
  const loading = usePositions((state) => state.loading);
  const positionsAtRisk = usePositions((state) => state.positionsAtRisk);

  const openMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (loading || !positionsAtRisk || positionsAtRisk.length === 0) return;

    setAnchorEl(event.currentTarget);
  };

  // TODO: change icons
  const statusIcon = loading ? (
    <CircularProgress size={20} />
  ) : positionsAtRisk.length > 0 ? (
    <ErrorIcon />
  ) : (
    <Image
      src={'/assets/images/notifications/success.svg'}
      alt={'success icon'}
      width={20}
      height={20}
    />
  );

  return (
    <>
      <Box mr="-2rem">
        <Chip
          data-cy="wallet-status"
          onClick={openMenu}
          label={statusIcon}
          sx={{
            borderRadius: '4rem',
            height: '2.25rem',
            width: '2.25rem',
            padding: '0.438rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            position: 'relative',
            left: '-2rem',
            '.MuiChip-label': { padding: '0', width: 20, height: 20 },
          }}
        />
      </Box>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
          disablePadding: true,
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 1 }}
        PaperProps={{
          sx: { background: palette.secondary.contrastText, padding: '0.5rem' },
        }}
      >
        {positionsAtRisk.map((position, index) => (
          <MenuItem
            data-cy="liquidation-risk-menu-item"
            key={index}
            onClick={() => {
              setAnchorEl(null);
              showPosition(
                VaultType.BORROW,
                router,
                false,
                position.vault,
                walletChainId
              );
            }}
            sx={{ borderRadius: 1.5, padding: '0.5rem 0.75rem' }}
          >
            <ListItem position={position} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

const ErrorIcon = () => (
  <Image
    src={'/assets/images/notifications/error.svg'}
    alt={'error icon'}
    width={20}
    height={20}
  />
);

const ListItem = ({ position }: { position: BorrowingPosition }) => {
  return (
    <Stack direction="row" alignItems="flex-start" gap={2}>
      <ErrorIcon />
      <Stack direction="column">
        <Typography variant="small">
          Liquidation Risk Alert for{' '}
          <b>
            {position.debt.currency.symbol}-
            {position.collateral.currency.symbol}
          </b>
        </Typography>
        <Typography variant="xsmallDark">View Position</Typography>
      </Stack>
    </Stack>
  );
};

export default StatusChip;
