import {
  Button,
  Container,
  Divider,
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

      <Divider
        sx={{
          display: { xs: 'block', sm: 'none' },
          mb: '1rem',
        }}
      />

      <Container
        sx={{
          pl: { xs: '0.25rem', sm: '1rem' },
          pr: { xs: '0.25rem', sm: '1rem' },
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Stack width="100%" alignItems="center" mt="-20%">
          <Image
            src="/assets/images/404/404.svg"
            height={80}
            width={238}
            alt="404 image"
          />
          <Typography variant="h4" mt="2.5rem" mb={0} gutterBottom>
            Page not found
          </Typography>
          <Typography
            variant="smallDark"
            fontSize="1rem"
            mt="1rem"
            mb={0}
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
