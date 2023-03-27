import { Box, Link, Typography } from '@mui/material';

export function getLinkNotification(message: string) {
  return <CustomToastWithLink link="test" message={message} />;
}

export function CustomToastWithLink({
  link,
  message,
}: {
  link: string;
  message: string;
}) {
  return (
    <Box>
      <Link href={link} target="_blank">
        <Typography variant="small">{message}</Typography>
      </Link>
    </Box>
  );
}
