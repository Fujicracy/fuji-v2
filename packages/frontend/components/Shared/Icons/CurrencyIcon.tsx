import { useTheme } from '@mui/material';
import { Currency } from '@x-fuji/sdk';
import { SyntheticEvent, useState } from 'react';

import { getTokenImage } from '../../../helpers/paths';
import { Icon, renderIcon, renderIconError } from './Base/Icon';

interface Props extends Icon {
  currency: Currency | string;
}

function CurrencyIcon(props: Props) {
  const { palette } = useTheme();
  const { currency } = props;
  const symbol = typeof currency === 'string' ? currency : currency.symbol;
  const path = getTokenImage(symbol);
  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>();

  if (error) {
    return renderIconError(props);
  }

  return renderIcon(props, path, symbol, (e) => setError(e));
}

export default CurrencyIcon;
