import LaunchIcon from '@mui/icons-material/Launch';
import { Link, Stack, Typography } from '@mui/material';
import { ChainId } from '@x-fuji/sdk';
import Image from 'next/image';
import {
  CloseButtonProps,
  Id,
  Slide,
  toast,
  ToastOptions,
} from 'react-toastify';

import { transactionUrl } from './chains';

type NotificationType = 'error' | 'info' | 'success';

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
  link?: NotificationLink;
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

const CloseButton = ({ closeToast }: CloseButtonProps) => (
  <Image
    width={20}
    height={20}
    src={`/assets/images/notifications/close.svg`}
    alt={`close icon`}
    onClick={closeToast}
  />
);

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
    icon: null,
    closeButton: CloseButton,
  };

  return toast(
    <CustomToast link={link} message={message} type={type} />,
    options
  );
}

export function dismiss(id: NotificationId) {
  toast.dismiss(id);
}

export function CustomToast({
  link,
  message,
  type,
}: NotificationWithLinkProps) {
  return (
    <Stack direction="row">
      <Image
        src={`/assets/images/notifications/${type}.svg`}
        width={20}
        height={20}
        alt={type}
        style={{}}
      />
      <Stack sx={{ marginLeft: '0.75rem', marginTop: '-0.25rem' }}>
        <Typography variant="body1" sx={{ fontSize: '1rem' }}>
          {message}
        </Typography>
        {link && (
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
        )}
      </Stack>
    </Stack>
  );
}
