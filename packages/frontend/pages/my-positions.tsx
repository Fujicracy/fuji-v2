import { NextPage } from "next"
import Head from "next/head"
import { Container, useTheme, useMediaQuery } from "@mui/material"

import Footer from "../components/Shared/Footer"
import Header from "../components/Shared/Header/Header"

import MyPositions from "../components/Positions/MyPositions"

const MyPositionPage: NextPage = () => {
  const { breakpoints } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down("sm"))

  return (
    <>
      <Head>
        <title>My positions - Fuji-v2</title>
        <meta name="description" content="See and manage your open positions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <Container
        sx={{
          mt: { xs: "2rem", sm: "4rem" },
          mb: { xs: "7rem", sm: "0" },
          pl: { xs: "1rem", sm: "1rem" },
          pr: { xs: "1rem", sm: "1rem" },
          minHeight: "75vh",
        }}
      >
        <MyPositions />
      </Container>

      {!isMobile && <Footer />}
    </>
  )
}

export default MyPositionPage
