import CloseIcon from '@mui/icons-material/Close';
import { Button, Dialog, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

type ConfirmTransactionModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ConfirmTransactionModal({
  open,
  onClose,
}: ConfirmTransactionModalProps) {
  const { palette } = useTheme();

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
          Confirm Transaction
        </Typography>

        <Button
          variant="gradient"
          size="medium"
          fullWidth
          onClick={() => console.log('test')}
          data-cy="new-borrow-redirect"
          sx={{
            mt: '1.375rem',
          }}
        >
          Confirm
        </Button>
      </Paper>
    </Dialog>
  );
}

export default ConfirmTransactionModal;
