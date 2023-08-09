import { Button, Container, Link, Stack, Typography } from '@mui/material';
import Head from 'next/head';
import Image from 'next/image';
import React from 'react';

const SomethingWentWrongPage = () => {
  return (
    <>
      <Head>
        <title>Something went wrong - Fuji V2 Himalaya</title>
        <meta name="description" content="Something went wrong" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container
        sx={{
          pl: { xs: '0.25rem' },
          pr: { xs: '0.25rem' },
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
            <Button variant="text" size="medium" sx={{ height: '3rem' }}>
              Go back home
            </Button>
          </Link>
        </Stack>
      </Container>
    </>
  );
};

export default SomethingWentWrongPage;
