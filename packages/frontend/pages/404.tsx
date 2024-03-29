import { Button, Container, Link, Stack, Typography } from '@mui/material';
import Head from 'next/head';
import React from 'react';

import NotFoundIcon from '../components/Shared/Icons/NotFoundIcon';

const NotFoundPage = () => {
  return (
    <>
      <Head>
        <title>404 - Fuji V2 Himalaya</title>
        <meta name="description" content="Page not found" />
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
          <NotFoundIcon />
          <Typography
            variant="h4"
            mt="2.5rem"
            textAlign="center"
            mb={0}
            gutterBottom
          >
            Page not found
          </Typography>
          <Typography
            variant="smallDark"
            fontSize="1rem"
            mt="1rem"
            mb={0}
            textAlign="center"
            gutterBottom
          >
            {"The page you are looking for doesn't exist or has been moved."}
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

export default NotFoundPage;
