import { Stack } from '@mui/material';
import Image from 'next/image';
import React from 'react';

function NotFoundIcon() {
  return (
    <Stack direction="row" alignItems="center" gap="1rem">
      <Image
        src="/assets/images/errors/4.svg"
        height={80}
        width={54}
        alt="4 image"
      />
      <Image
        src="/assets/images/errors/somethingWentWrong.svg"
        height={80}
        width={95}
        alt="Something went wrong image"
      />
      <Image
        src="/assets/images/errors/4.svg"
        height={80}
        width={54}
        alt="4 image"
      />
    </Stack>
  );
}

export default NotFoundIcon;
