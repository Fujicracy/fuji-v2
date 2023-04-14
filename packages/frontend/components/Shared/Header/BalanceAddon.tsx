import { Box, Chip, CircularProgress, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Balances } from '@web3-onboard/core/dist/types';

import { useHistory } from '../../../store/history.store';
import Balance from '../Balance';

type BalanceAddonProps = {
  formattedAddress: string;
  balance?: Balances;
  ens?: string;
  onClick: (element: EventTarget & HTMLSpanElement) => void;
};
function BalanceAddon({
  formattedAddress,
  balance,
  ens,
  onClick,
}: BalanceAddonProps) {
  const { palette } = useTheme();
  const active = useHistory((state) => state.ongoingTransactions.length);

  const [bal] = balance ? Object.values<string>(balance) : [''];
  const [token] = balance ? Object.keys(balance) : [''];

  const formattedBalance = <Balance balance={+bal} symbol={token} />;
  const pending = active && (
    <Grid container alignItems="center">
      <CircularProgress size={16} sx={{ mr: '0.625rem' }} />
      <Typography variant="small" onClick={(e) => onClick(e.currentTarget)}>
        {active} pending
      </Typography>
    </Grid>
  );

  return (
    <Box mr="-2rem" ml={balance ? '' : '2rem'}>
      {balance && (
        <Chip
          label={formattedBalance}
          sx={{ paddingRight: '2rem', fontSize: '0.875rem' }}
        />
      )}

      <Chip
        onClick={(e) => onClick(e.currentTarget)}
        label={pending || ens || formattedAddress}
        sx={{
          background: palette.secondary.light,
          borderRadius: '4rem',
          height: '2.25rem',
          padding: '0.438rem 0.75rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          position: 'relative',
          left: '-2rem',
          backgroundColor: '#3C3D41', // Not part of the design system, one time use
          border: `1px solid ${palette.secondary.light}`,
          '&:hover': {
            backgroundColor: palette.secondary.main,
          },
        }}
      />
    </Box>
  );
}

export default BalanceAddon;
