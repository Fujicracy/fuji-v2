import { Link } from '@mui/material';

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
    <div>
      <Link href={link} target="_blank">
        {message}
      </Link>
    </div>
  );
}
