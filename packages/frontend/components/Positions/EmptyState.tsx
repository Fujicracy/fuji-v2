import {
  Box,
  Button,
  TableCell,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { VaultType } from '@x-fuji/sdk';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';

import { showBorrow, showLend } from '../../helpers/navigation';
import { useAuth } from '../../store/auth.store';

function EmptyState({
  reason,
  columnsCount,
  minHeight,
  withButton = true,
  type = VaultType.BORROW,
}: {
  reason: 'no-wallet' | 'no-positions';
  columnsCount: number;
  type?: VaultType;
  withButton?: boolean;
  minHeight?: string;
}) {
  const { palette } = useTheme();

  const router = useRouter();

  const login = useAuth((state) => state.login, shallow);

  const isLend = type === VaultType.LEND;

  const config = useMemo(() => {
    return reason === 'no-wallet'
      ? {
          title: 'No wallet connected',
          infoText: <></>,
          button: {
            variant: 'secondary',
            label: 'Connect Wallet',
            action: login,
            fullWidth: false,
          },
        }
      : {
          title: 'No Positions',
          infoText: (
            <Typography
              variant="smallDark"
              mt="0.5rem"
              sx={{
                whiteSpace: 'normal',
              }}
            >
              {!isLend ? 'Deposit and borrow in ' : 'Lend to '} a vault to view
              your dashboard metrics
            </Typography>
          ),
          button: {
            variant: 'gradient',
            label: !isLend ? 'Borrow' : 'Lend',
            action: () => {
              !isLend ? showBorrow(router) : showLend(router);
            },
            fullWidth: true,
          },
        };
  }, [reason, login, router, isLend]);

  return (
    <TableRow>
      <TableCell
        colSpan={columnsCount}
        align="center"
        sx={{ m: '0', textAlign: 'center', p: 0 }}
      >
        <Box
          sx={{
            minHeight: minHeight || '25rem',
            display: 'flex',
            flexDirection: 'column',
            pt: '3rem',
            justifyContent: 'start',
            alignItems: 'center',
            overflow: 'hidden',
            ['@media screen and (max-width:700px)']: {
              maxWidth: '90vw',
              minHeight: '15rem',
              p: '3rem 1rem 0 1rem',
            },
          }}
        >
          <Typography variant="h4" color={palette.text.primary}>
            {config.title}
          </Typography>

          {config.infoText}

          {withButton && (
            <Button
              variant={config.button.variant as 'gradient' | 'secondary'}
              size="medium"
              onClick={() => config.button.action()}
              data-cy="connect-wallet"
              sx={{ mt: '1.5rem', maxWidth: '17rem' }}
              fullWidth={config.button.fullWidth}
            >
              {config.button.label}
            </Button>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
}

export default EmptyState;
