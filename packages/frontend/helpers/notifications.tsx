import LaunchIcon from '@mui/icons-material/Launch';
import { Link, Stack, Typography } from '@mui/material';
import { ChainId } from '@x-fuji/sdk';
import Image from 'next/image';
import { Id, toast, ToastOptions } from 'react-toastify';

import { transactionUrl } from './chains';

type NotificationType = 'error' | 'info' | 'success' | 'warning';

export type NotificationId = Id;

export enum NotificationDuration {
  SHORT = 3000,
  MEDIUM = 5000,
  LONG = 7500,
}

type NotificationArguments = {
  message: string;
  type: NotificationType;
  link?: string;
  sticky?: boolean;
  duration?: NotificationDuration;
};

export function notify({
  message,
  type,
  link,
  sticky,
  duration,
}: NotificationArguments) {
  const options: Partial<ToastOptions> = {
    position: toast.POSITION.TOP_LEFT,
    theme: 'dark',
    toastId: type + message + link,
    autoClose: sticky ? false : duration ?? NotificationDuration.MEDIUM,
  };

  if (link) {
    return toast(getLinkNotification({ message, link, type }), options);
  }

  return toast[type](message, options);
}

export function dismiss(id: NotificationId) {
  toast.dismiss(id);
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
  type = 'info',
}: {
  link: string;
  message?: string;
  type?: NotificationType;
}) {
  return <CustomToastWithLink link={link} message={message} type={type} />;
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
          <LaunchIcon
            sx={{ paddingLeft: '0.2rem', paddingTop: '0.2rem' }}
            fontSize="inherit"
          />
        </Typography>
      </Link>
    </Stack>
  );
}
