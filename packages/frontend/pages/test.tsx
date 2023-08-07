import { Container, Divider, Grid } from '@mui/material';
import { NextPage } from 'next';
import Head from 'next/head';

import MigrateFrom from '../components/Migtator/MigrateFrom';

const TestPage: NextPage = () => {
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
          mt: { xs: '0', sm: '4rem' },
          mb: { xs: '7rem', sm: '0' },
          pl: { xs: '0.25rem' },
          pr: { xs: '0.25rem' },
          minHeight: '75vh',
        }}
      >
        <Grid
          container
          wrap="wrap"
          alignItems="flex-start"
          justifyContent="center"
        >
          <Grid item xs={4}>
            <MigrateFrom />
          </Grid>
          <Grid item xs={4} ml={{ xs: 0, md: 3 }} mt={{ xs: 3, md: 0 }}>
            <MigrateFrom />
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default TestPage;
