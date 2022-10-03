import { Container, Grid } from "@mui/material"
import { NextPage } from "next"
import Head from "next/head"

import Borrow from "../components/Borrow/Borrow"
import Footer from "../components/Layout/Footer"
import Header from "../components/Layout/Header"
import Overview from "../components/Borrow/Overview"

const BorrowPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Borrow - xFuji</title>
        <meta
          name="description"
          content="borrow at the best rate on any chain"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <Container>
        <Grid container wrap="wrap">
          <Grid item xs={12} md={5}>
            <Borrow />
          </Grid>
          <Grid sx={{ display: { xs: "none", sm: "block" } }} item md={7}>
            <Overview />
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </div>
  )
}

export default BorrowPage
