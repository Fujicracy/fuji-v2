import Head from "next/head"

import {
  CircularProgress,
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
import {
  BasePosition,
  viewDynamicPosition,
  viewFuturePosition,
} from "../../helpers/positions"

type BorrowWrapperProps = {
  managePosition: boolean
  query?: {
    address: string
    chain: string
  }
}

function BorrowWrapper(
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

  const [basePosition, setBasePosition] = useState<BasePosition>(
    viewDynamicPosition(!managePosition, undefined)
  )
  const [loading, setLoading] = useState<boolean>(
    managePosition && (!positions || positions.length === 0)
  )

  useEffect(() => {
    let matchPosition: Position | undefined
    let futurePosition: Position | undefined
    if (address && positions.length > 0 && query) {
      matchPosition = positions.find(
        (position) =>
          position.vault?.address.value === query.address &&
          position.vault?.chainId.toString() === query.chain
      )
      futurePosition = matchPosition
        ? viewFuturePosition(baseCollateral, baseDebt, matchPosition, mode)
        : undefined
    }
    const basePosition = viewDynamicPosition(
      !managePosition,
      matchPosition,
      futurePosition
    )
    setBasePosition(basePosition)
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

  /*
    Draft implementation: problem is, if the user opens /my-position/[pid] directly,
    we don't have the positions loaded yet. So we need to wait for the data to load
    and change the values in the store.
  */
  useEffect(() => {
    if (managePosition && loading && basePosition) {
      const vault = basePosition.position.vault
      if (vault) {
        ;(async () => {
          const changeAll = useBorrow.getState().changeAll
          await changeAll(vault.collateral, vault.debt, vault)
          setLoading(false)
        })()
      }
    }
  }, [managePosition, basePosition, loading])

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
        {loading ? (
          <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            justifyContent="center"
            style={{ minHeight: "100vh" }}
          >
            <CircularProgress size={32} />
          </Grid>
        ) : (
          <Grid container wrap="wrap" alignItems="flex-start" spacing={3}>
            <Grid item xs={12} md={5}>
              <Borrow
                managePosition={managePosition}
                basePosition={basePosition}
              />
            </Grid>
            <Grid item sm={12} md={7}>
              {isMobile ? (
                <TransactionSummary />
              ) : (
                <Overview basePosition={basePosition} />
              )}
            </Grid>
          </Grid>
        )}
      </Container>

      {!isMobile && <Footer />}
    </>
  )
}

export default BorrowWrapper

BorrowWrapper.defaultProps = {
  managePosition: false,
}
