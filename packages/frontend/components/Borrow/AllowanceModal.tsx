import CloseIcon from '@mui/icons-material/Close';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Dialog,
  Link,
  Paper,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { CONNEXT_ROUTER_ADDRESS } from '@x-fuji/sdk';
import Image from 'next/image';

import { AssetType } from '../../helpers/assets';
import { addressUrl } from '../../helpers/chains';
import { useBorrow } from '../../store/borrow.store';

type AllowanceModalProps = {
  type: AssetType;
  handleClose: () => void;
};

function AllowanceModal({ type, handleClose }: AllowanceModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { allowance, input, token } = useBorrow((state) => {
    if (type === 'debt') return state.debt;
    return state.collateral;
  });
  const allow = useBorrow((state) => state.allow);

  const amount = parseFloat(input);
  const address = CONNEXT_ROUTER_ADDRESS[token.chainId].value;
  const handleAllow = () => allow(amount, type, handleClose);

  return (
    <Dialog
      open
      onClose={handleClose}
      sx={{
        '.MuiPaper-root': {
          width: isMobile ? '100%' : 'auto',
        },
        margin: isMobile ? 1 : 'auto',
        backdropFilter: { xs: 'blur(0.313rem)', sm: 'none' },
      }}
      maxWidth="xs"
    >
      <Paper
        variant="outlined"
        sx={{ p: { xs: '1rem', sm: '1.5rem' }, textAlign: 'center' }}
      >
        <CloseIcon
          sx={{ cursor: 'pointer', position: 'absolute', right: 16, top: 16 }}
          onClick={handleClose}
          fontSize="small"
        />

        <Box mt={2}>
          <Image
            src="/assets/images/usdroundicon.png"
            width="60"
            height="60"
            alt="ust icon"
          />
        </Box>

        <Typography variant="h5" mt="2rem">
          Approve spending limit
        </Typography>

        <Typography mt="1rem">
          Approve the router contract{' '}
          <Link
            href={addressUrl(token.chainId ?? '', address)}
            target="_blank"
            rel="noreferrer"
          >
            <u>{address}</u>
          </Link>{' '}
          to use {amount} {token.symbol} from your wallet.
        </Typography>

        <LoadingButton
          variant="gradient"
          size="large"
          fullWidth
          sx={{ mt: '1.5rem' }}
          loading={allowance.status === 'allowing'}
          onClick={handleAllow}
        >
          Approve
        </LoadingButton>
      </Paper>
    </Dialog>
  );
}

export default AllowanceModal;
