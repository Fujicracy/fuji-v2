import CloseIcon from '@mui/icons-material/Close';
import {
  Button,
  Card,
  Dialog,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Token } from '@x-fuji/sdk';

import { AssetChange } from '../../helpers/assets';
import { chainName } from '../../helpers/chains';
import { formatValue } from '../../helpers/values';
import { NetworkIcon } from './Icons';
import TokenIcon from './Icons/TokenIcon';

type ConfirmTransactionModalProps = {
  collateral: AssetChange;
  debt: AssetChange;
  open: boolean;
  onClose: () => void;
};

export function ConfirmTransactionModal({
  collateral,
  debt,
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
          maxWidth: '30rem',
        },
      }}
    >
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
            right: '3%',
          }}
          onClick={onClose}
        />
        <Typography variant="h5" color={palette.text.primary}>
          Confirm Transaction
        </Typography>

        <AssetBox
          type="collateral"
          token={collateral.token}
          value={collateral.input || '0'}
        />

        <AssetBox type="debt" token={debt.token} value={debt.input || '0'} />

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

function AssetBox({
  type,
  token,
  value,
}: {
  type: 'debt' | 'collateral';
  token: Token;
  value: string;
}) {
  const { palette } = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: palette.secondary.light,
        mt: '1rem',
        width: '100%',
      }}
    >
      <Stack
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="small">
          {type === 'debt' ? 'Borrow' : 'Deposit Collateral'}
        </Typography>

        <Stack flexDirection="row" alignItems="center" gap={0.75}>
          <TokenIcon token={token} height={16} width={16} />
          <Typography variant="small">
            {`${formatValue(value, {
              maximumFractionDigits: 3,
            })} ${token.symbol}`}
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ m: '0.75rem 0', height: '1px', width: '100%' }} />

      <Stack
        width="100%"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography variant="small">Network</Typography>

        <Stack flexDirection="row" alignItems="center" gap={0.75}>
          <NetworkIcon network={token.chainId} height={16} width={16} />
          <Typography variant="small">{chainName(token.chainId)}</Typography>
        </Stack>
      </Stack>

      <Typography
        textAlign="start"
        mt=".5rem"
        variant="xsmall"
        sx={{ width: '50%' }}
      >
        The designated network where your debt position will be on.
      </Typography>
    </Card>
  );
}

export default ConfirmTransactionModal;
