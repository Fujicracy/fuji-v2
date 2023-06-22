import {
  ListItemIcon,
  ListItemText,
  MenuItem,
  SxProps,
  Theme,
  Typography,
} from '@mui/material';
import { Currency } from '@x-fuji/sdk';
import { ReactElement } from 'react';

import Balance from '../Balance';
import { CurrencyIcon } from '../Icons';

type CurrencyItem = {
  currency?: Currency;
  balance?: number;
  prepend?: ReactElement;
  sx?: SxProps<Theme>;
  onClick?: (currency: Currency) => void;
};

const CurrencyItem = ({
  currency,
  balance,
  prepend,
  sx,
  onClick,
}: CurrencyItem) => {
  if (!currency) {
    return (
      <>
        <Typography variant="smallDark">Select a token</Typography>
        {prepend}
      </>
    );
  }

  return (
    <MenuItem
      data-cy="currency-select"
      key={currency.name}
      value={currency.symbol}
      onClick={() => onClick && onClick(currency)}
      sx={sx}
    >
      <ListItemIcon>
        <CurrencyIcon currency={currency} height={24} width={24} />
      </ListItemIcon>
      <ListItemText>
        <Typography variant="h6">{currency.symbol}</Typography>
      </ListItemText>
      {typeof balance === 'number' && (
        <Typography variant="smallDark" ml="3rem">
          <Balance balance={balance} />
        </Typography>
      )}
      {prepend}
    </MenuItem>
  );
};

export default CurrencyItem;
