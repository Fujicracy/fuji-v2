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
import { useBorrow } from "../../store/borrow.store"
import { useEffect, useState } from "react"
import { useAuth } from "../../store/auth.store"
import { usePositions } from "../../store/positions.store"
import { Position } from "../../store/models/Position"
import { viewDynamicPosition } from "../../helpers/positions"

type BorrowWrapperProps = {
  managePosition: boolean
  query?: {
    address: string
    chain: string
  }
}

export default function BorrowWrapper(
  { managePosition, query }: BorrowWrapperProps = { managePosition: false }
) {
  const { breakpoints } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down("sm"))

  const address = useAuth((state) => state.address)
  const positions = usePositions((state) => state.positions)
  const baseCollateral = useBorrow((state) => state.collateral)
  const baseDebt = useBorrow((state) => state.debt)
  const baseLtv = useBorrow((state) => state.ltv)
  const mode = useBorrow((state) => state.mode)

  const [position, setPosition] = useState<Position>(
    viewDynamicPosition(!managePosition, baseCollateral, baseDebt, baseLtv)
  )
  const [futurePosition, setFuturePosition] = useState<Position | undefined>(
    undefined
  )

  useEffect(() => {
    let matchPosition: Position | undefined
    if (address && positions.length > 0 && query) {
      matchPosition = positions.find(
        (position) =>
          position.vault?.address.value === query.address &&
          position.vault?.chainId.toString() === query.chain
      )

      // setFuturePosition(futurePosition)
      // window.alert(matchPosition?.debt.usdPrice)
    }
    const basePosition = viewDynamicPosition(
      !managePosition,
      baseCollateral,
      baseDebt,
      baseLtv,
      matchPosition
    )
    setPosition(basePosition)
  }, [
    baseCollateral,
    baseDebt,
    baseLtv,
    address,
    positions,
    mode,
    query,
    managePosition,
  ])

  return (
    <>
      <Head>
        <title>{`${managePosition ? "Position" : "Borrow"} - xFuji`}</title>
        <meta
          name="description"
          content={`${
            managePosition
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
            <Borrow managePosition={managePosition} />
          </Grid>
          <Grid item sm={12} md={7}>
            {isMobile ? (
              <TransactionSummary />
            ) : (
              <Overview position={position} />
            )}
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
