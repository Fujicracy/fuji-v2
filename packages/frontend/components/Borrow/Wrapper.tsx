import Head from "next/head"

import {
  Container,
  Divider,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material"

import Borrow from "../../components/Borrow/Borrow"
import Footer from "../../components/Shared/Footer"
import Header from "../../components/Shared/Header"
import Overview from "./Overview/Overview"
import TransactionSummary from "../../components/Borrow/TransactionSummary"

type BorrowWrapperProps = {
  managePosition: boolean
  pid?: string | undefined
}

export default function BorrowWrapper(
  props: BorrowWrapperProps = { managePosition: false }
) {
  const { breakpoints } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down("sm"))

  return (
    <>
      <Head>
        <title>{`${
          props.managePosition ? "Position" : "Borrow"
        } - xFuji`}</title>
        <meta
          name="description"
          content={`${
            props.managePosition
              ? "position detail"
              : "borrow at the best rate on any chain"
          }`}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <Divider
        sx={{
          display: { xs: "block", sm: "none" },
          mb: "1rem",
        }}
      />

      <Container
        sx={{
          mt: { xs: "0", sm: "4rem" },
          mb: { xs: "7rem", sm: "0" },
          pl: { xs: "0.25rem", sm: "1rem" },
          pr: { xs: "0.25rem", sm: "1rem" },
          minHeight: "75vh",
        }}
      >
        <Grid container wrap="wrap" alignItems="flex-start" spacing={3}>
          <Grid item xs={12} md={5}>
            <Borrow managePosition={props.managePosition} />
          </Grid>
          <Grid item sm={12} md={7}>
            {isMobile ? <TransactionSummary /> : <Overview />}
          </Grid>
        </Grid>
      </Container>

      {!isMobile && <Footer />}
    </>
  )
}

BorrowWrapper.defaultProps = {
  managePosition: false,
}
