import {
  Box,
  Button,
  Dialog,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { showBorrow } from '../../helpers/navigation';
import { formatValue } from '../../helpers/values';
import { useAuth } from '../../store/auth.store';
import { usePositions } from '../../store/positions.store';
import BorrowLendingTabNavigation from '../Shared/BorrowLendingTabNavigation';
import PeriodOptions from '../Shared/Filters/PeriodOptions';
import ModalHeader from '../Shared/ModalHeader';
import PositionLendYieldTable from './PositionLendYieldsTable';
import PositionYieldTable from './PositionYieldTable';

type PositionYieldsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function PositionYieldsModal({
  open,
  onClose,
}: PositionYieldsModalProps) {
  const { palette } = useTheme();
  const router = useRouter();
  const loading = usePositions((state) => state.loading);
  const totalAPY = usePositions((state) => state.totalAPY);
  const account = useAuth((state) => state.address);
  const borrowPositions = usePositions((state) => state.lendingPositions);
  const lendingPositions = usePositions((state) => state.lendingPositions);

  const [daysPeriod, setDaysPeriod] = useState<number>(1);
  const [currentTab, setCurrentTab] = useState(0);
  const [estEarnings, setEstEarnings] = useState(0);

  useEffect(() => {
    if (
      !account ||
      (borrowPositions.length === 0 && lendingPositions.length === 0)
    ) {
      onClose();
    }
  }, [account, borrowPositions, lendingPositions, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          maxWidth: '706px',
        },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: { xs: '1rem', sm: '1.5rem' },
          textAlign: 'center',
        }}
      >
        <ModalHeader title="Estimated Yield / Cost" onClose={() => onClose()} />

        <Divider sx={{ mb: '1.375rem' }} />

        <Grid container mb="1rem">
          <BorrowLendingTabNavigation onChange={(tab) => setCurrentTab(tab)} />
        </Grid>

        <Stack
          alignItems="end"
          direction="row"
          justifyContent="space-between"
          sx={{
            gap: '1rem',
            mb: '1.375rem',
            ['@media screen and (max-width: 517px)']: {
              flexWrap: 'wrap',
            },
          }}
        >
          <Stack alignItems="center" direction="row">
            <Box sx={{ textAlign: 'start' }}>
              <Typography
                variant="small"
                color={palette.text.primary}
                sx={{ fontSize: '0.875rem' }}
              >
                Net APY
              </Typography>
              <Typography
                variant="h5"
                color={Number(totalAPY) >= 0 ? palette.success.main : 'inherit'}
              >
                {formatValue(totalAPY, {
                  maximumFractionDigits: 2,
                })}
                %
              </Typography>
            </Box>
            <Box ml="3rem" sx={{ textAlign: 'start' }}>
              <Typography
                variant="small"
                color={palette.text.primary}
                sx={{ fontSize: '0.875rem' }}
              >
                Net {estEarnings >= 0 ? 'Earnings' : 'Costs'}
              </Typography>
              <Typography variant="h5" color={palette.text.primary}>
                {formatValue(estEarnings, {
                  style: 'currency',
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Box>
          </Stack>

          <PeriodOptions onChange={setDaysPeriod} />
        </Stack>
        <Box sx={{ maxWidth: '46rem', minWidth: '41rem', minHeight: '12rem' }}>
          {currentTab === 0 ? (
            <PositionYieldTable
              loading={loading}
              days={daysPeriod}
              callback={(value) => setEstEarnings(value)}
            />
          ) : (
            <PositionLendYieldTable loading={loading} days={daysPeriod} />
          )}
        </Box>

        <Button
          variant="gradient"
          size="medium"
          fullWidth
          onClick={() => showBorrow(router)}
          data-cy="new-borrow-redirect"
          sx={{
            mt: '1.375rem',
          }}
        >
          Deposit and Borrow
        </Button>
      </Paper>
    </Dialog>
  );
}

export default PositionYieldsModal;
