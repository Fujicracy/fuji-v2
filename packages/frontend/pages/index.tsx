import { Container, Divider } from '@mui/material';
import { NextPage } from 'next';
import Head from 'next/head';

import Markets from '../components/Markets/Markets';
import Footer from '../components/Shared/Footer';

const MarketsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Fuji V2 Himalaya</title>
        <meta
          name="description"
          content="Cross-chain money market aggregator that solves liquidity fragmentation and money market optimization problems."
        />
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
          mt: { xs: '0', sm: '5rem' },
          mb: { xs: '7rem', sm: '0' },
          pl: { xs: '0.25rem', sm: '1rem' },
          pr: { xs: '0.25rem', sm: '1rem' },
          minHeight: '75vh',
        }}
      >
        <Markets />
      </Container>

      <Footer />
    </>
  );
};

export default MarketsPage;
