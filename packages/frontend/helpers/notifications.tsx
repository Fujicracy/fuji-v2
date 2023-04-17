import LaunchIcon from '@mui/icons-material/Launch';
import { Link, Stack, Typography } from '@mui/material';
import { ChainId } from '@x-fuji/sdk';
import Image from 'next/image';
import { Id, Slide, toast, ToastOptions } from 'react-toastify';

import { transactionUrl } from './chains';

type NotificationType = 'error' | 'info' | 'success' | 'warning';

export type NotificationLinkType = 'tx' | 'discord' | 'other';

export type NotificationLink = {
  url: string;
  type: NotificationLinkType;
};

export type NotificationId = Id;

export enum NotificationDuration {
  SHORT = 3000,
  MEDIUM = 5000,
  LONG = 7500,
}

type NotificationArguments = {
  message: string;
  type: NotificationType;
  link?: NotificationLink | undefined;
  sticky?: boolean;
  duration?: NotificationDuration;
};

type NotificationWithLinkProps = {
  link: NotificationLink;
  message?: string;
  type: NotificationType;
};

type NotificationTxLinkArguments = {
  chainId: ChainId;
  hash: string;
};

export function getTransactionUrl(transaction: NotificationTxLinkArguments) {
  return transactionUrl(transaction.chainId, transaction.hash);
}

export function getTransactionLink(
  transaction: NotificationTxLinkArguments
): NotificationLink | undefined {
  const url = getTransactionUrl(transaction);
  if (url) {
    return {
      url,
      type: 'tx',
    };
  }
  return undefined;
}

export function notify({
  message,
  type,
  link,
  sticky,
  duration,
}: NotificationArguments) {
  const options: Partial<ToastOptions> = {
    transition: Slide,
    position: toast.POSITION.TOP_LEFT,
    theme: 'dark',
    toastId: type + message + link,
    autoClose: sticky ? false : duration ?? NotificationDuration.MEDIUM,
  };

  if (link) {
    return toast(
      getLinkNotification({
        message,
        link,
        type,
      }),
      options
    );
  }

  return toast[type](message, options);
}

export function dismiss(id: NotificationId) {
  toast.dismiss(id);
}

export function getLinkNotification({
  message,
  link,
  type = 'info',
}: NotificationWithLinkProps) {
  return <CustomToastWithLink link={link} message={message} type={type} />;
}

export function CustomToastWithLink({
  link,
  message,
  type,
}: NotificationWithLinkProps) {
  return (
    <Stack direction="row" alignItems="center">
      <Image
        src={`/assets/images/shared/${type}.svg`}
        width={20}
        height={20}
        alt={type}
      />
      <Stack sx={{ marginLeft: '0.75rem' }}>
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {message}
        </Typography>
        {}
        <Link href={link.url} target="_blank">
          <Typography sx={{ fontSize: '0.75rem' }}>
            {link.type === 'tx'
              ? 'View Transaction'
              : link.type === 'discord'
              ? 'Go to Discord'
              : 'Open'}
            <LaunchIcon
              sx={{ paddingLeft: '0.2rem', paddingTop: '0.2rem' }}
              fontSize="inherit"
            />
          </Typography>
        </Link>
      </Stack>
    </Stack>
  );
}
