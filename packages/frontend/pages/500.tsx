import {
  Button,
  Container,
  Link,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Head from 'next/head';
import Image from 'next/image';
import React from 'react';

import Footer from '../components/Shared/Footer';
import Header from '../components/Shared/Header/Header';

const SomethingWentWrongPage = () => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  return (
    <>
      <Head>
        <title>Something went wrong - Fuji V2 Himalaya</title>
        <meta name="description" content="Something went wrong" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <Container
        sx={{
          pl: '1rem',
          pr: '1rem',
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          background: 'black',
        }}
      >
        <Stack width="100%" alignItems="center" mt="-20%">
          <Image
            src="/assets/images/errors/somethingWentWrong.svg"
            height={80}
            width={95}
            alt="Something went wrong image"
          />
          <Typography
            variant="h4"
            mt="2.5rem"
            textAlign="center"
            mb={0}
            gutterBottom
          >
            Oops! Something went wrong
          </Typography>
          <Typography
            variant="smallDark"
            fontSize="1rem"
            mt="1rem"
            mb={0}
            textAlign="center"
            gutterBottom
          >
            {
              'We encountered an error while trying to connect with our server. Please try again later.'
            }
          </Typography>
          <Link href="/" mt="1.5rem" variant="inherit">
            <Button variant="secondary" size="medium" sx={{ height: '3rem' }}>
              Go back home
            </Button>
          </Link>
        </Stack>
      </Container>

      {!isMobile && <Footer />}
    </>
  );
};

export default SomethingWentWrongPage;