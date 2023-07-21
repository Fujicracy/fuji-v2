import { useTheme } from '@mui/material';
import { SyntheticEvent, useState } from 'react';

import { getProviderImage } from '../../../helpers/paths';
import { Icon, renderIcon, renderIconError } from './Base/Icon';

interface Props extends Icon {
  provider: string;
}

const defaultImage = '/assets/images/protocol-icons/providers/Aave%20V3.svg';

function ProviderIcon(props: Props) {
  const { palette } = useTheme();
  const { provider } = props;
  const path = getProviderImage(provider);
  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>();

  if (error) {
    return renderIconError(props);
  }
  return renderIcon(
    props,
    path,
    provider,
    (e) => setError(e),
    error ? defaultImage : undefined
  );
}

export default ProviderIcon;
