import { Box, Container, Divider } from '@mui/material';
import { NextPage } from 'next';
import Head from 'next/head';

import Footer from '../components/App/Footer';
import Lending from '../components/Lending/Lending';

const LendingPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Lending - Fuji V2 Himalaya</title>
        <meta name="description" content="Lend assets and earn interest" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Divider
        sx={{
          display: { xs: 'block', sm: 'none' },
          mb: '1rem',
        }}
      />

      <Container
        sx={{
          mt: { xs: '0', sm: '4rem' },
          mb: { xs: '7rem', sm: '0' },
          pl: { xs: '0.25rem', sm: '1rem' },
          pr: { xs: '0.25rem', sm: '1rem' },
          minHeight: '75vh',
        }}
      >
        <Box sx={{ height: '45rem', width: '100%' }}>
          <Lending />
        </Box>
      </Container>

      <Footer />
    </>
  );
};

export default LendingPage;
