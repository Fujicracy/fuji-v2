import LaunchIcon from '@mui/icons-material/Launch';
import { Box, Link, Typography } from '@mui/material';
import { ChainId } from '@x-fuji/sdk';

import { transactionUrl } from './chains';

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
}: {
  link: string;
  message?: string;
  isTransaction?: boolean;
}) {
  return isTransaction ? (
    <CustomToastWithTransactionLink link={link} />
  ) : (
    <CustomToastWithLink link={link} message={message} />
  );
}

export function CustomToastWithLink({
  link,
  message,
}: {
  link: string;
  message?: string;
}) {
  return (
    <Box>
      <Link href={link} target="_blank">
        <Typography variant="small">{message}</Typography>
      </Link>
    </Box>
  );
}

export function CustomToastWithTransactionLink({ link }: { link: string }) {
  return (
    <Box>
      <Link href={link} target="_blank" variant="smallDark">
        View transaction{' '}
        <LaunchIcon
          sx={{ top: '1px', position: 'relative' }}
          fontSize="inherit"
        />
      </Link>
    </Box>
  );
}
