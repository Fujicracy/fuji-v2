import { Container, Stack, Typography, useTheme } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React from 'react';

import { PATH } from '../../constants';

function Lending() {
  const { palette } = useTheme();
  const router = useRouter();

  return (
    <Container>
      <Stack
        flexDirection="row"
        alignItems="center"
        onClick={() =>
          router.push({ pathname: PATH.MARKETS, query: { tab: 1 } })
        }
        sx={{
          cursor: 'pointer',
          mt: { xs: '0', sm: '-2.5rem' },
          mb: '1rem',
        }}
      >
        <Image
          src="/assets/images/shared/arrowBack.svg"
          height={14}
          width={16}
          alt="Arrow Back"
        />
        <Typography variant="small" ml="0.75rem" color={palette.info.main}>
          Back to All Lending Vaults
        </Typography>
      </Stack>
    </Container>
  );
}

export default Lending;
