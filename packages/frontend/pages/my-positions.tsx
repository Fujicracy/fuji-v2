import { Container } from '@mui/material';
import { NextPage } from 'next';
import Head from 'next/head';

import Footer from '../components/App/Footer';
import MyPositions from '../components/Positions/MyPositions';

const MyPositionPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>My positions - Fuji V2 Himalaya</title>
        <meta name="description" content="Manage your open positions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container
        sx={{
          mt: { xs: '2rem', sm: '4rem' },
          mb: { xs: '7rem', sm: '0' },
          pl: { xs: '1rem', sm: '1rem' },
          pr: { xs: '1rem', sm: '1rem' },
          minHeight: '75vh',
        }}
      >
        <MyPositions />
      </Container>

      <Footer />
    </>
  );
};

export default MyPositionPage;
