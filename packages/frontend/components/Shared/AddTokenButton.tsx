import LoadingButton from '@mui/lab/LoadingButton';
import { useState } from 'react';

import { SerializableToken } from '../../helpers/history';
import { addTokenToMetamask } from '../../helpers/metamask';

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
    } catch (e) {
      // user probably rejected
      setStatus('error');
    }
  };

  return (
    <LoadingButton
      variant="rounded"
      onClick={handleClick}
      loading={status === 'loading'}
      disabled={status === 'success'}
    >
      {status === 'success' ? <>Done sir ✅</> : `Add ${token.symbol}`}
    </LoadingButton>
  );
}

export default AddTokenButton;
