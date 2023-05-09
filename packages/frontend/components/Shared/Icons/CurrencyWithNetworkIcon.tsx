import { Stack } from '@mui/material';
import { Currency } from '@x-fuji/sdk';

import CurrencyIcon from './CurrencyIcon';
import NetworkIcon from './NetworkIcon';

type CurrencyWithNetworkIconProps = {
  currency: Currency | string;
  network: string;
  innerTop: string;
};

function CurrencyWithNetworkIcon({
  currency,
  network,
  innerTop,
}: CurrencyWithNetworkIconProps) {
  return (
    <Stack direction="row">
      <CurrencyIcon currency={currency} width={32} height={32} />
      <NetworkIcon
        network={network}
        height={16}
        width={16}
        sx={{
          position: 'relative',
          right: '0.75rem',
          border: '0.5px solid white',
          borderRadius: '100%',
          height: '17px',
          width: '17px',
          top: innerTop,
        }}
      />
    </Stack>
  );
}

export default CurrencyWithNetworkIcon;

CurrencyWithNetworkIcon.defaultProps = {
  innerTop: '1.5rem',
};
