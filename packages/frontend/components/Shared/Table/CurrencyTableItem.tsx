import { Stack, Typography } from '@mui/material';

import { CurrencyIcon } from '../Icons';

function CurrencyTableItem({
  currency,
  label,
  dataCy,
  iconDimensions,
}: {
  currency: string;
  label: string;
  iconDimensions: number;
  dataCy?: string;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="nowrap"
      data-cy={dataCy}
    >
      <CurrencyIcon
        currency={currency}
        height={iconDimensions}
        width={iconDimensions}
      />
      <Typography ml="0.5rem" variant="small">
        {label}
      </Typography>
    </Stack>
  );
}

export default CurrencyTableItem;
