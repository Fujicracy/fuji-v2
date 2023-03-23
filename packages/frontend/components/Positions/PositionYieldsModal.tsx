import CloseIcon from '@mui/icons-material/Close';
import { Button, Dialog, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';

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

  return (
    <Dialog open={open} onClose={onClose}>
      <Paper
        variant="outlined"
        sx={{
          maxWidth: '30rem',
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
