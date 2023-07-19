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
import { VaultType } from '@x-fuji/sdk';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { showBorrow, showLend } from '../../helpers/navigation';
import { getEstimatedEarnings } from '../../helpers/positions';
import { formatValue } from '../../helpers/values';
import { useAuth } from '../../store/auth.store';
import { usePositions } from '../../store/positions.store';
import BorrowLendingTabNavigation from '../Shared/BorrowLendingTabNavigation';
import PeriodOptions from '../Shared/Filters/PeriodOptions';
import ModalHeader from '../Shared/ModalHeader';
import PositionYieldTable from './PositionYieldTable';

type PositionYieldsModalProps = {
  open: boolean;
  onClose: () => void;
};

function PositionYieldsModal({ open, onClose }: PositionYieldsModalProps) {
  const { palette } = useTheme();
  const router = useRouter();
  const loading = usePositions((state) => state.loading);
  const totalAPY = usePositions((state) => state.totalAPY);
  const account = useAuth((state) => state.address);
  const borrowPositions = usePositions((state) => state.borrowPositions);
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

  useEffect(() => {
    const borrowPositionEstEarnings = borrowPositions.reduce((a, c) => {
      return (
        a +
        getEstimatedEarnings({
          days: daysPeriod,
          collateralInUsd: c.collateral.usdPrice,
          collateralAPR: c.collateral.baseAPR,
          debtInUsd: c.debt?.usdPrice,
          debtAPR: c.debt?.baseAPR,
        })
      );
    }, 0);

    const lendingPositionsEstEarnings = lendingPositions.reduce((a, c) => {
      return (
        a +
        getEstimatedEarnings({
          days: daysPeriod,
          collateralInUsd: c.collateral.usdPrice,
          collateralAPR: c.collateral.baseAPR,
          debtInUsd: 0,
          debtAPR: 0,
        })
      );
    }, 0);

    setEstEarnings(borrowPositionEstEarnings + lendingPositionsEstEarnings);
  }, [daysPeriod, borrowPositions, lendingPositions]);

  const newActionButtonConfig =
    currentTab === 0
      ? {
          label: 'Deposit and Borrow',
          action: () => showBorrow(router),
          dataCy: 'new-borrow-redirect',
        }
      : {
          label: 'Lend',
          action: () => showLend(router),
          dataCy: 'new-lend-redirect',
        };

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
          alignItems="center"
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
          <PositionYieldTable
            loading={loading}
            days={daysPeriod}
            positions={currentTab === 0 ? borrowPositions : lendingPositions}
            type={currentTab === 0 ? VaultType.BORROW : VaultType.LEND}
          />
        </Box>

        <Button
          variant="gradient"
          size="medium"
          fullWidth
          onClick={newActionButtonConfig.action}
          data-cy={newActionButtonConfig.dataCy}
          sx={{
            mt: '1.375rem',
          }}
        >
          {newActionButtonConfig.label}
        </Button>
      </Paper>
    </Dialog>
  );
}

export default PositionYieldsModal;
