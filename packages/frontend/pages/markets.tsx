import { Container, Divider, useMediaQuery, useTheme } from '@mui/material';
import { NextPage } from 'next';
import Head from 'next/head';

import Markets from '../components/Markets/Markets';
import Footer from '../components/Shared/Footer';
import Header from '../components/Shared/Header/Header';

const MarketsPage: NextPage = () => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  return (
    <>
      <Head>
        <title>Markets - xFuji</title>
        <meta
          name="description"
          content="Overview of all the markets that Fuji V2 integrates."
        />
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
          mt: { xs: '0', sm: '4rem' },
          mb: { xs: '7rem', sm: '0' },
          pl: { xs: '0.25rem', sm: '1rem' },
          pr: { xs: '0.25rem', sm: '1rem' },
          minHeight: '75vh',
        }}
      >
        <Markets />
      </Container>

      {!isMobile && <Footer />}
    </>
  );
};

export default MarketsPage;
