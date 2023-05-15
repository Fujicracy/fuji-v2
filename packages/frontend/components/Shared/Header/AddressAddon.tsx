import { useWallets } from '@web3-onboard/react';
import { useEffect } from 'react';

import { useAuth } from '../../../store/auth.store';

const AddressAddon = () => {
  const connectedWallets = useWallets();

  const status = useAuth((state) => state.status);
  const disconnect = useAuth((state) => state.disconnect);
  const changeWallet = useAuth((state) => state.changeWallet);

  useEffect(() => {
    if (!connectedWallets) {
      disconnect();
    } else if (connectedWallets.length > 0) {
      changeWallet(connectedWallets);
    }
  }, [connectedWallets, status, changeWallet, disconnect]);

  return <></>;
};

export default AddressAddon;
