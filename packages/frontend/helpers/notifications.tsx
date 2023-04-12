import LaunchIcon from '@mui/icons-material/Launch';
import { Link, Stack, Typography } from '@mui/material';
import { ChainId } from '@x-fuji/sdk';
import Image from 'next/image';
import { toast, ToastOptions } from 'react-toastify';

import { transactionUrl } from './chains';

type NotificationType = 'error' | 'info' | 'success' | 'warning';

type NotifyArgs = {
  message: string;
  type: NotificationType;
  link?: string;
  isTransaction?: boolean;
};

export function notify({ message, type, link, isTransaction }: NotifyArgs) {
  const options: Partial<ToastOptions> = {
    position: toast.POSITION.TOP_RIGHT,
    theme: 'dark',
    toastId: type + message + link + isTransaction,
  };

  if (link) {
    toast(getLinkNotification({ message, link, isTransaction, type }), options);
    return;
  }

  toast[type](message, options);
}

export function getTransactionUrl(transaction: {
  chainId: ChainId;
  hash: string;
}) {
  return transactionUrl(transaction.chainId, transaction.hash);
}

export function getLinkNotification({
  message,
  link,
  isTransaction,
  type = 'info',
}: {
  link: string;
  message?: string;
  isTransaction?: boolean;
  type?: 'error' | 'info' | 'success' | 'warning';
}) {
  return isTransaction ? (
    <CustomToastWithTransactionLink link={link} />
  ) : (
    <CustomToastWithLink link={link} message={message} type={type} />
  );
}

export function CustomToastWithLink({
  link,
  message,
  type,
}: {
  link: string;
  type: NotificationType;
  message?: string;
}) {
  return (
    <Stack direction="row" alignItems="center">
      <Image
        src={`/assets/images/shared/${type}.svg`}
        width={20}
        height={20}
        alt={type}
      />
      <Link ml="0.5rem" href={link} target="_blank">
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {message}
        </Typography>
      </Link>
    </Stack>
  );
}

export function CustomToastWithTransactionLink({ link }: { link: string }) {
  return (
    <Stack direction="row" alignItems="center">
      <Image
        src={'/assets/images/shared/success.svg'}
        width={20}
        height={20}
        alt="Success"
      />
      <Link
        ml="0.5rem"
        href={link}
        target="_blank"
        variant="body1"
        sx={{ fontSize: '1rem' }}
      >
        View transaction{' '}
        <LaunchIcon
          sx={{ top: '1px', position: 'relative' }}
          fontSize="inherit"
        />
      </Link>
    </Stack>
  );
}
