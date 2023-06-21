import {
  Box,
  Button,
  TableCell,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';

import { showBorrow } from '../../helpers/navigation';
import { useAuth } from '../../store/auth.store';

function EmptyState({
  reason,
  columnsCount,
  minHeight,
}: {
  reason: 'no-wallet' | 'no-positions';
  columnsCount: number;
  minHeight?: string;
}) {
  const { palette } = useTheme();

  const router = useRouter();

  const login = useAuth((state) => state.login, shallow);

  const config = useMemo(() => {
    return reason === 'no-wallet'
      ? {
          title: 'No wallet connected',
          infoText: <></>,
          button: {
            label: 'Connect Wallet',
            action: login,
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
              Deposit and borrow in a vault to view your dashboard metrics
            </Typography>
          ),
          button: {
            label: 'Borrow',
            action: () => showBorrow(router),
          },
        };
  }, [reason, login, router]);

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

          <Button
            variant="gradient"
            size="large"
            onClick={() => config.button.action()}
            data-cy="connect-wallet"
            fullWidth
            sx={{ mt: '1.5rem', maxWidth: '17rem' }}
          >
            {config.button.label}
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
}

export default EmptyState;
