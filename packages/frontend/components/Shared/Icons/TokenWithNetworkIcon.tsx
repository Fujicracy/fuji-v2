import { Stack } from '@mui/material';
import { Currency } from '@x-fuji/sdk';

import NetworkIcon from './NetworkIcon';
import TokenIcon from './TokenIcon';

type TokenWithNetworkIconProps = {
  token: Currency | string;
  network: string;
  innerTop: string;
};

function TokenWithNetworkIcon({
  token,
  network,
  innerTop,
}: TokenWithNetworkIconProps) {
  return (
    <Stack direction="row">
      <TokenIcon token={token} width={32} height={32} />
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

export default TokenWithNetworkIcon;

TokenWithNetworkIcon.defaultProps = {
  innerTop: '1.5rem',
};
