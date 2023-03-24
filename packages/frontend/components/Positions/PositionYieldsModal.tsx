import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Chip,
  Dialog,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { formatValue } from '../../helpers/values';
import { usePositions } from '../../store/positions.store';
import BorrowLendingTabNavigation from '../Shared/BorrowLendingTabNavigation';
import PositionYieldTable from './PositionYieldTable';

type PositionYieldsModalProps = {
  open: boolean;
  onClose: () => void;
};

type PeriodOption = {
  label: string;
  value: string;
};

const periodOptions: PeriodOption[] = [
  { label: '365D', value: 'year' },
  { label: '30D', value: 'month' },
  { label: '7D', value: 'week' },
  { label: '1D', value: 'day' },
];

export function PositionYieldsModal({
  open,
  onClose,
}: PositionYieldsModalProps) {
  const { palette } = useTheme();
  const router = useRouter();
  const loading = usePositions((state) => state.loading);

  const [period, setPeriod] = useState<PeriodOption>(periodOptions[0]);
  const [currentTab, setCurrentTab] = useState(0);

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
        <CloseIcon
          sx={{
            cursor: 'pointer',
            position: 'absolute',
            right: '3%',
          }}
          onClick={onClose}
        />
        <Typography variant="h5" color={palette.text.primary}>
          Position yields
        </Typography>

        <Divider sx={{ m: '1.375rem 0' }} />

        <BorrowLendingTabNavigation
          onChange={(tab) => setCurrentTab(tab)}
          isLendingDisabled
        />

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
              <Typography variant="h5" color={palette.success.main}>
                {1.93}%
              </Typography>
            </Box>
            <Box ml="3rem" sx={{ textAlign: 'start' }}>
              <Typography
                variant="small"
                color={palette.text.primary}
                sx={{ fontSize: '0.875rem' }}
              >
                Net Earnings
              </Typography>
              <Typography variant="h5" color={palette.text.primary}>
                {formatValue(812.31, {
                  style: 'currency',
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Box>
          </Stack>

          <Stack alignItems="center" direction="row-reverse" gap={0.5}>
            {periodOptions.map((option) => (
              <Chip
                key={option.value}
                sx={{
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: `${
                    option.value === period.value ? 'white' : palette.info.main
                  }`,
                  background: `${
                    option.value === period.value
                      ? palette.secondary.main
                      : palette.secondary.dark
                  }`,
                }}
                onClick={() => setPeriod(option)}
                label={option.label}
              />
            ))}
          </Stack>
        </Stack>

        {currentTab === 0 && (
          <Box sx={{ width: '35rem' }}>
            <PositionYieldTable loading={loading} />
          </Box>
        )}

        <Button
          variant="gradient"
          size="medium"
          fullWidth
          onClick={() => router.push('/borrow')}
          data-cy="new-borrow-redirect"
          sx={{
            mt: '1.375rem',
          }}
        >
          Deposit and Borrow a new assets
        </Button>
      </Paper>
    </Dialog>
  );
}

export default PositionYieldsModal;
