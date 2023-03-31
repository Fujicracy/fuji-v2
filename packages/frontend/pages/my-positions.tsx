import { Container, useMediaQuery, useTheme } from '@mui/material';
import { NextPage } from 'next';
import Head from 'next/head';

import MyPositions from '../components/Positions/MyPositions';
import Footer from '../components/Shared/Footer';
import Header from '../components/Shared/Header/Header';

const MyPositionPage: NextPage = () => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  return (
    <>
      <Head>
        <title>My positions - Fuji V2 Himalaya</title>
        <meta name="description" content="Manage your open positions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

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

      {!isMobile && <Footer />}
    </>
  );
};

export default MyPositionPage;
