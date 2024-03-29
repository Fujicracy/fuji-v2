import LaunchIcon from '@mui/icons-material/Launch';
import { Link, Stack, Typography, useTheme } from '@mui/material';
import { ChainId, FujiError } from '@x-fuji/sdk';
import Image from 'next/image';
import {
  CloseButtonProps,
  Id,
  Slide,
  toast,
  ToastOptions,
} from 'react-toastify';

import { formatOnchainNotificationMessage } from '../constants';
import { transactionUrl } from './chains';

type NotificationType = 'error' | 'info' | 'success';

export enum NotificationLinkType {
  TX,
  DISCORD,
  OTHER,
}

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
  link?: NotificationLink;
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

export const getTransactionLink = (
  transaction: NotificationTxLinkArguments
): NotificationLink | undefined => {
  const url = getTransactionUrl(transaction);
  if (url) {
    return {
      url,
      type: NotificationLinkType.TX,
    };
  }
  return undefined;
};

export const showOnchainErrorNotification = (error: FujiError) => {
  const chain =
    typeof error.info?.chain === 'string' ? error.info.chain : undefined;
  notify({
    type: 'error',
    message: formatOnchainNotificationMessage(chain),
  });
};

export const notify = ({
  message,
  type,
  link,
  sticky,
  duration,
}: NotificationArguments) => {
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
};

export const dismiss = (id: NotificationId) => {
  toast.dismiss(id);
};

const getTransactionUrl = (transaction: NotificationTxLinkArguments) => {
  return transactionUrl(transaction.chainId, transaction.hash);
};

const CloseButton = ({ closeToast }: CloseButtonProps) => (
  <Image
    width={20}
    height={20}
    src={`/assets/images/notifications/close.svg`}
    alt={`close icon`}
    onClick={closeToast}
    style={{ marginTop: '0.5rem', cursor: 'pointer' }}
  />
);

function CustomToast({ link, message, type }: NotificationWithLinkProps) {
  const { palette } = useTheme();
  return (
    <Stack direction="row" sx={{ p: '2px' }}>
      <Image
        src={`/assets/images/notifications/${type}.svg`}
        width={24}
        height={24}
        alt={type}
        style={{}}
      />
      <Stack sx={{ marginLeft: '1rem' }}>
        <Typography
          variant="body1"
          sx={{
            fontSize: '1rem',
            color: palette.text.primary,
            lineHeight: '160%',
          }}
        >
          {message}
        </Typography>
        {link && (
          <Link href={link.url} target="_blank">
            <Typography
              sx={{
                fontSize: '0.75rem',
                mt: '0.25rem',
                lineHeight: '160%',
                color: palette.info.dark,
                '&:hover': {
                  color: palette.text.primary,
                },
              }}
            >
              {link.type === NotificationLinkType.TX
                ? 'View Transaction '
                : link.type === NotificationLinkType.DISCORD
                ? 'Go to Discord '
                : 'Open '}
              <LaunchIcon sx={{ verticalAlign: 'middle' }} fontSize="inherit" />
            </Typography>
          </Link>
        )}
      </Stack>
    </Stack>
  );
}
