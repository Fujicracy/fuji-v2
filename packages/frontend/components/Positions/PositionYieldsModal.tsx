import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Dialog, Divider, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { usePositions } from '../../store/positions.store';
import BorrowLendingTabNavigation from '../Shared/BorrowLendingTabNavigation';
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
            right: '2rem',
          }}
          onClick={onClose}
        />
        <Typography variant="h5" color={palette.text.primary}>
          Position yields
        </Typography>

        <Divider sx={{ m: '1.375rem 0' }} />

        <BorrowLendingTabNavigation onChange={(tab) => setCurrentTab(tab)} />

        <Box sx={{ mb: '1.375rem' }}>
          <PositionYieldTable loading={loading} />
        </Box>

        <Button
          variant="gradient"
          size="medium"
          fullWidth
          onClick={() => router.push('/borrow')}
          data-cy="new-borrow-redirect"
        >
          Deposit and Borrow a new assets
        </Button>
      </Paper>
    </Dialog>
  );
}

export default PositionYieldsModal;
