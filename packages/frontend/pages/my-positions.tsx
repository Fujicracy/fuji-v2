import { NextPage } from "next"
import Head from "next/head"
import {
  Box,
  Card,
  Container,
  Grid,
  Tab,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
  TableBody,
  Stack,
  Button,
  Chip,
} from "@mui/material"

import Footer from "../components/Layout/Footer"
import Header from "../components/Layout/Header"
import { useState } from "react"
import TokenIcon from "../components/TokenIcon"

type Metric = {
  name: string
  value: number
  valueSym?: "$" | "%"
  action?: string
}
const keyMetrics: Metric[] = [
  { name: "Total Deposits", value: 120000, valueSym: "$" },
  { name: "Total Debt", value: 20000, valueSym: "$" },
  { name: "Net APY", value: 1.93, valueSym: "%", action: "View" }, // TODO: tooltip & actions
  {
    name: "Available to Borrow",
    value: 60000,
    valueSym: "$",
    action: "Borrow",
  }, // TODO: tooltip & actions
  { name: "Positions at Risk", value: 3, action: "Close position" }, // TODO: tooltip & actions
]

type Row = {
  borrow: { sym: string; amount: number; usdValue: number }
  collateral: { sym: string; amount: number; usdValue: number }
  apy: number
  liquidationPrice: number
  oraclePrice: number
}
const fakeRows: Row[] = [
  {
    borrow: { sym: "DAI", amount: 80000, usdValue: 1 },
    collateral: { sym: "ETH", amount: 10, usdValue: 1242.42 },
    apy: 2.25,
    liquidationPrice: 1500,
    oraclePrice: 2000,
  },
  {
    borrow: { sym: "USDT", amount: 80000, usdValue: 1 },
    collateral: { sym: "ETH", amount: 10, usdValue: 1242.42 },
    apy: 2.25,
    liquidationPrice: 1501,
    oraclePrice: 2000,
  },
]

const MyPositionPage: NextPage = () => {
  const { breakpoints, palette } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down("sm"))

  // We want to display only 4 metrics in mobile, so we leave positions at risk aside.
  const metrics = keyMetrics.filter((m) =>
    isMobile ? m.name !== "Positions at Risk" : true
  )

  const [currentTab, setCurrentTab] = useState(0)
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) =>
    setCurrentTab(newValue)

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
        <Typography variant="h4" mb={1}>
          My Positions
        </Typography>
        <Typography variant="body">
          The protocol manage your borrowing and lending position for maximum
          capital efficiency
        </Typography>

        <Box mt={4}>
          <Card
            variant="outlined"
            sx={{ background: palette.secondary.contrastText }}
          >
            <Grid container>
              {metrics.map((m, i) => (
                <Grid item padding={{ xs: 1, md: 0 }} key={m.name} xs={6} md>
                  <Metric metric={m} borderLeft={!isMobile && i > 0} />
                </Grid>
              ))}
            </Grid>
          </Card>
        </Box>

        <Box mt={2} mb={3}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant={isMobile ? "fullWidth" : "standard"}
          >
            <Tab label="Borrowing" />
            <Tab
              disabled
              label={
                <Stack direction="row" alignItems="center" gap={1}>
                  Lending
                  {!isMobile && (
                    <Chip
                      variant="gradient"
                      label="Coming soon"
                      sx={{ cursor: "pointer" }}
                    />
                  )}
                </Stack>
              }
            />
          </Tabs>
        </Box>

        {currentTab === 0 && (
          <TableContainer>
            <Table aria-label="Positions table" size="small">
              <TableHead>
                <TableRow sx={{ height: "2.625rem" }}>
                  <TableCell>Borrow</TableCell>
                  <TableCell>Collateral</TableCell>
                  <TableCell align="right">Variable APR</TableCell>
                  <TableCell align="right">Borrowed</TableCell>
                  <TableCell align="right">Collateral value</TableCell>
                  <TableCell align="right">Oracle price</TableCell>
                  <TableCell align="right">Liquidation Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fakeRows.map((row) => (
                  // TODO: key should  be smth else unique to a row, maybe the vault address ?
                  <TableRow key={row.liquidationPrice}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <TokenIcon
                          token={row.borrow.sym}
                          width={32}
                          height={32}
                        />
                        {row.borrow.sym}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <TokenIcon
                          token={row.collateral.sym}
                          width={32}
                          height={32}
                        />
                        {row.collateral.sym}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="small" color={palette.warning.main}>
                        {row.apy}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box pt={1} pb={1}>
                        <Typography variant="small">
                          {(
                            row.borrow.amount * row.borrow.usdValue
                          ).toLocaleString("en-US", {
                            style: "currency",
                            currency: "usd",
                            minimumFractionDigits: 0,
                          })}
                        </Typography>
                        <br />
                        <Typography variant="small" color={palette.info.main}>
                          {row.borrow.amount.toLocaleString("en-US")}{" "}
                          {row.borrow.sym}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box pt={1} pb={1}>
                        <Typography variant="small">
                          {(
                            row.collateral.amount * row.collateral.usdValue
                          ).toLocaleString("en-US", {
                            style: "currency",
                            currency: "usd",
                            maximumFractionDigits: 0,
                          })}
                        </Typography>
                        <br />
                        <Typography variant="small" color={palette.info.main}>
                          {row.collateral.amount.toLocaleString("en-US")}{" "}
                          {row.collateral.sym}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {row.oraclePrice.toLocaleString("en-US", {
                        style: "currency",
                        currency: "usd",
                        minimumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <Box pt={1} pb={1}>
                        <Typography variant="small">
                          {row.liquidationPrice.toLocaleString("en-US", {
                            style: "currency",
                            currency: "usd",
                            minimumFractionDigits: 0,
                          })}
                        </Typography>
                        <br />
                        <Typography
                          variant="small"
                          color={palette.success.main}
                        >
                          ~15%{" "}
                        </Typography>
                        <Typography variant="small" color={palette.info.main}>
                          above
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      {!isMobile && <Footer />}
    </>
  )
}

export default MyPositionPage

type MetricProps = { metric: Metric; borderLeft: boolean }
const Metric = ({ metric, borderLeft: leftBorder }: MetricProps) => {
  const { palette, breakpoints } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down("sm"))

  const borderColor = palette.secondary.light // TODO: should use a palette border color instead
  const nameColor = palette.info.main
  const buttonSx = {
    padding: "6px 16px 5px",
    lineHeight: "0.875rem",
    fontSize: "0.875rem",
    backgroundColor: palette.secondary.main,
    border: "none",
    color: palette.text.primary,
  }

  return (
    <Box
      borderLeft={leftBorder ? `1px solid ${borderColor}` : ""}
      pl={leftBorder ? 4 : ""}
    >
      <Typography color={nameColor} fontSize="0.875rem">
        {metric.name}
      </Typography>
      {/* TODO: use helper to format balance */}
      <Typography
        fontSize="1.5rem"
        color={metric.name === "Positions at Risk" ? "error" : "inherit"}
      >
        {metric.valueSym === "$"
          ? `${metric.value.toLocaleString("en-US", {
              style: "currency",
              currency: "usd",
              maximumFractionDigits: 0,
            })}`
          : metric.valueSym === "%"
          ? `${metric.value}%`
          : metric.value}{" "}
        {isMobile && <br />}
        {metric.action && (
          // TODO: Button need refactoring in theme, variant need to change colors / background / borders, size need to change padding / fontsize
          <Button variant="secondary" sx={buttonSx}>
            {metric.action}
          </Button>
        )}
      </Typography>
    </Box>
  )
}
