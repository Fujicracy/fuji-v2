import { useTheme } from '@mui/material';
import { ChainId } from '@x-fuji/sdk';
import { SyntheticEvent, useEffect, useState } from 'react';

import { chainName } from '../../../helpers/chains';
import { getNetworkImage } from '../../../helpers/paths';
import { Icon, renderIcon, renderIconError } from './Base/Icon';

interface Props extends Icon {
  network: string | ChainId;
}

function NetworkIcon(props: Props) {
  const { palette } = useTheme();
  const { network } = props;

  const [name, setName] = useState<string>(
    typeof network === 'string' ? network : chainName(network)
  );
  const [path, setPath] = useState<string>('');
  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>();

  useEffect(() => {
    const nameToShow =
      typeof network === 'string' ? network : chainName(network);
    setName(nameToShow);
    setPath(getNetworkImage(nameToShow));
  }, [error, network]);

  if (error) {
    return renderIconError(props);
  }

  if (path && name) {
    return renderIcon(props, path, name, (e) => setError(e));
  }

  return null;
}

export default NetworkIcon;
