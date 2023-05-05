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
import React from 'react';

import Footer from '../components/Shared/Footer';
import Header from '../components/Shared/Header/Header';
import NotFoundIcon from '../components/Shared/Icons/NotFoundIcon';

const NotFoundPage = () => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  return (
    <>
      <Head>
        <title>404 - Fuji V2 Himalaya</title>
        <meta name="description" content="Page not found" />
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

export default NotFoundPage;
