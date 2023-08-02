import { Box, Chip, CircularProgress, Grid, Typography } from '@mui/material';

import { hiddenAddress } from '../../../helpers/values';
import { useHistory } from '../../../store/history.store';

type BalanceAddonProps = {
  address: string;
  ens?: string;
  onClick: (element: EventTarget & HTMLSpanElement) => void;
};
function WalletAddress({ address, ens, onClick }: BalanceAddonProps) {
  const active = useHistory(
    (state) =>
      state.ongoingTransactions.filter((o) => o.address === address).length
  );

  const formattedAddress = hiddenAddress(address);

  const pending = active && (
    <Grid container alignItems="center">
      <CircularProgress size={16} sx={{ mr: '0.625rem' }} />
      <Typography variant="small" onClick={(e) => onClick(e.currentTarget)}>
        {active} pending
      </Typography>
    </Grid>
  );

  return (
    <Box mr="-2rem" ml={4}>
      <Chip
        data-cy="header-address"
        onClick={(e) => onClick(e.currentTarget)}
        label={pending || ens || formattedAddress}
        sx={{
          borderRadius: '4rem',
          height: '2.25rem',
          padding: '0.438rem 0.75rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          position: 'relative',
          left: '-2rem',
        }}
      />
    </Box>
  );
}

export default WalletAddress;
