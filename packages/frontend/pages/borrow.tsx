import { NextPage } from "next"
import Head from "next/head"

import { Box, Card, Container, Grid, Typography } from "@mui/material"

import Borrow from "../components/Borrow/Borrow"
import Footer from "../components/Layout/Footer"
import Header from "../components/Layout/Header"
import Overview from "../components/Borrow/Overview"
import { useState } from "react"
import PreviewTransaction from "../components/Borrow/PreviewTransaction"

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

      <Container
        sx={{
          pl: { xs: "0.25rem", sm: "1rem" },
          pr: { xs: "0.25rem", sm: "1rem" },
        }}
      >
        <Grid container wrap="wrap" justifyContent="center">
          <Grid item xs={12} md={5}>
            <Borrow />
          </Grid>
          <Grid item md={7} sx={{ display: { xs: "none", sm: "flex" } }}>
            <Overview />
          </Grid>
          <Grid item xs={12} sx={{ display: { xs: "flex", sm: "none" } }}>
            <PreviewTransaction />
          </Grid>
        </Grid>
      </Container>

      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <Footer />
      </Box>
    </div>
  )
}

export default BorrowPage
