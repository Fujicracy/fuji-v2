import { Stack, Typography } from '@mui/material';
import { Currency } from '@x-fuji/sdk';

import { formatAssetWithSymbol } from '../../helpers/values';
import { CurrencyIcon } from '../Shared/Icons';

function AssetRadioLabel({
  currency,
  amount,
}: {
  currency: Currency;
  amount: number;
}) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="left" gap={0.5}>
      <CurrencyIcon currency={currency} width={16} height={16} />

      <Typography variant="small" fontWeight={500} lineHeight="100%">
        {formatAssetWithSymbol({ amount, symbol: currency.symbol })}
      </Typography>
    </Stack>
  );
}

export default AssetRadioLabel;
