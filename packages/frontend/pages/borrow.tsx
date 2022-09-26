import { Container, Grid } from '@mui/material'
import { NextPage } from 'next'
import Head from 'next/head'

import Borrow from '../components/Borrow'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Overview from '../components/Overview'

const BorrowPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Borrow - xFuji</title>
        <meta
          name='description'
          content='borrow at the best rate on any chain'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Header />

      <Container maxWidth='xl' >
        <Grid container>
          <Grid item xs={4}>
            <Borrow />
          </Grid>
          <Grid item xs={8}>
            <Overview />
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </div>
  )
}

export default BorrowPage
