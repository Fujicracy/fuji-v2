import { ListItem, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Balance } from '../../../../helpers/balances';
import { formatAssetWithSymbol, formatValue } from '../../../../helpers/values';
import { CurrencyWithNetworkIcon } from '../../../Shared/Icons';

type BalanceItemProps = {
  balance: Balance;
};

function BalanceItem({ balance }: BalanceItemProps) {
  const { palette } = useTheme();

  return (
    <ListItem sx={{ mt: 1.5, px: '1.25rem', py: '.25rem' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: '100%' }}
      >
        <Stack direction="row" alignItems="center" justifyContent="flex-start">
          <CurrencyWithNetworkIcon
            currency={balance.currency}
            network={balance.currency.chainId}
            innerTop="1.1rem"
          />
          <Stack sx={{ ml: -0.75 }}>
            <Typography variant="small" fontWeight={500}>
              {balance.currency.symbol}
            </Typography>
            <Typography variant="xsmall" mt={0.5} color={palette.info.main}>
              {balance.currency.name}
            </Typography>
          </Stack>
        </Stack>
        <Stack
          direction="column"
          alignItems="flex-end"
          justifyContent="flex-end"
          sx={{ flexGrow: 1, textAlign: 'right' }}
        >
          <Typography variant="small" fontWeight={500}>
            {formatAssetWithSymbol({
              amount: balance.amount,
              symbol: balance.currency.symbol,
            })}
          </Typography>
          <Typography variant="xsmall" mt={0.5} color={palette.info.main}>
            {balance.amountUsd
              ? `${formatValue(balance.amountUsd, {
                  style: 'currency',
                  maximumFractionDigits: 2,
                })}`
              : '-'}
          </Typography>
        </Stack>
      </Stack>
    </ListItem>
  );
}

export default BalanceItem;
