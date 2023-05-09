import { useTheme } from '@mui/material';
import { AbstractCurrency } from '@x-fuji/sdk';
import { SyntheticEvent, useState } from 'react';

import { getTokenImage } from '../../../helpers/paths';
import { Icon, renderIcon, renderIconError } from './Base/Icon';

interface Props extends Icon {
  token: AbstractCurrency | string;
}

function TokenIcon(props: Props) {
  const { palette } = useTheme();
  const { token } = props;
  const symbol = typeof token === 'string' ? token : token.symbol;
  const path = getTokenImage(symbol);
  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>();

  if (error) {
    return renderIconError(props, palette);
  }

  return renderIcon(props, path, symbol, (e) => setError(e));
}

export default TokenIcon;
