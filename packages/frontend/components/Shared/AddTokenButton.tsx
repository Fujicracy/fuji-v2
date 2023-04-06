import LoadingButton from '@mui/lab/LoadingButton';
import { useState } from 'react';

import { addTokenToMetamask } from '../../helpers/metamask';
import { SerializableToken } from '../../store/history.store';

type ButtonAddTokenProps = {
  token: SerializableToken;
};

function AddTokenButton({ token }: ButtonAddTokenProps) {
  type Status = 'initial' | 'loading' | 'success' | 'error';
  const [status, setStatus] = useState<Status>('initial');

  const handleClick = async () => {
    setStatus('loading');
    // TODO: what if asset chain is !== current chain ??
    try {
      await addTokenToMetamask(token);
      setStatus('success');
    } catch (e) {
      // user probably rejected
      console.error('>>>', e);
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
