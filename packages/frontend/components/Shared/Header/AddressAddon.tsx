import { useWallets } from '@web3-onboard/react';
import { useEffect } from 'react';

import { useAuth } from '../../../store/auth.store';

const AddressAddon = () => {
  const connectedWallets = useWallets();

  const status = useAuth((state) => state.status);
  const changeWallet = useAuth((state) => state.changeWallet);

  useEffect(() => {
    if (connectedWallets.length > 0 && status === 'initial') {
      changeWallet(connectedWallets);
    }
  }, [connectedWallets, changeWallet, status]);

  return <></>;
};

export default AddressAddon;
