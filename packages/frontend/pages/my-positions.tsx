import { NextPage } from "next"
import Head from "next/head"

import {
  Box,
  Card,
  Container,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"

import Footer from "../components/Layout/Footer"
import Header from "../components/Layout/Header"

type Metric = { name: string; value: number; valueSym?: "$" | "%" }
const keyMetrics: Metric[] = [
  { name: "Total deposits", value: 120000, valueSym: "$" },
  { name: "Total dept", value: 20000, valueSym: "$" },
  { name: "Net APY", value: 1.93, valueSym: "%" }, // TODO: tooltip & actions
  { name: "Available to borrow", value: 60000, valueSym: "$" }, // TODO: tooltip & actions
  { name: "At risk", value: 3 }, // TODO: tooltip & actions
]

const MyPositionPage: NextPage = () => {
  const { breakpoints } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down("sm"))

  return (
    <>
      <Head>
        <title>My positions - xFuji</title>
        <meta name="description" content="See and manage your open positions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <Container
        sx={{
          mt: { xs: "0", sm: "4rem" },
          mb: { xs: "7rem", sm: "0" },
          pl: { xs: "0.25rem", sm: "1rem" },
          pr: { xs: "0.25rem", sm: "1rem" },
          minHeight: "75vh",
        }}
      >
        <Typography variant="h4">My Positions</Typography>
        <Typography variant="body">
          The protocol manage your borrowing and lending position for maximum
          capital efficiency
        </Typography>

        <Box mt={4}>
          <Card variant="outlined">
            <Grid container>
              {keyMetrics.map((m, i) => (
                <Grid key={m.name} item xs>
                  <Box>
                    <Metric metric={m} borderLeft={i > 0} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Box>
      </Container>

      {!isMobile && <Footer />}
    </>
  )
}

export default MyPositionPage

type MetricProps = { metric: Metric; borderLeft: boolean }
const Metric = ({ metric, borderLeft: leftBorder }: MetricProps) => {
  const { palette } = useTheme()
  const borderColor = palette.secondary.light // TODO: should use a palette border color instead
  const nameColor = palette.info.main

  return (
    <Box
      borderLeft={leftBorder ? `1px solid ${borderColor}` : ""}
      pl={leftBorder ? 4 : ""}
    >
      <Typography color={nameColor} fontSize="0.75rem">
        {metric.name}
      </Typography>
      {/* TODO: use helper to format balance */}
      <Typography fontSize="1.5rem">
        {metric.valueSym === "$"
          ? `$${metric.value.toLocaleString("en-US")}`
          : metric.valueSym === "%"
          ? `${metric.value}%`
          : metric.value}
        {/* TODO: metric action */}
      </Typography>
    </Box>
  )
}
