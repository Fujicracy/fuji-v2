import LoadingButton from '@mui/lab/LoadingButton';
import Image from 'next/image';
import { useState } from 'react';

import { SerializableToken } from '../../helpers/history';
import { addTokenToMetamask } from '../../helpers/metamask';
import { notify } from '../../helpers/notifications';

type ButtonAddTokenProps = {
  token: SerializableToken;
};

function AddTokenButton({ token }: ButtonAddTokenProps) {
  type Status = 'initial' | 'loading' | 'success' | 'error';
  const [status, setStatus] = useState<Status>('initial');

  const handleClick = async () => {
    setStatus('loading');
    try {
      await addTokenToMetamask(token);
      setStatus('success');
      notify({
        type: 'success',
        message: `${token.symbol} added`,
      });
    } catch (e) {
      // user probably rejected
      setStatus('error');
    }
  };

  return (
    <LoadingButton
      variant="text"
      fullWidth
      size="medium"
      onClick={handleClick}
      loading={status === 'loading'}
    >
      {status !== 'loading' && (
        <Image
          src={'/assets/images/shared/wallet.svg'}
          alt={'Wallet Icon'}
          height={16}
          width={16}
          style={{ marginRight: '0.5rem' }}
        />
      )}
      {`Add ${token.symbol} to Wallet`}
    </LoadingButton>
  );
}

export default AddTokenButton;
