import { useEffect, useMemo, useState } from "react"
import {
  Box,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Typography,
  useTheme,
  TableBody,
  Stack,
  Button,
  Skeleton,
} from "@mui/material"
import { useRouter } from "next/router"
import { TokenIcon, TokenWithNetworkIcon } from "../Shared/Icons"
import { chainName } from "../../helpers/chains"
import { usePositions } from "../../store/positions.store"
import { useAuth } from "../../store/auth.store"
import { getRows, PositionRow, vaultFromAddress } from "../../helpers/positions"
import { formatValue } from "../../helpers/values"
import { showPosition } from "../../helpers/navigation"
import { shallow } from "zustand/shallow"

type PositionsBorrowTableProps = {
  loading: boolean
}

function MyPositionsBorrowTable({ loading }: PositionsBorrowTableProps) {
  const { palette } = useTheme()
  const router = useRouter()
  const account = useAuth((state) => state.address)
  const positions = usePositions((state) => state.positions)
  const [rows, setRows] = useState<PositionRow[]>([])

  useEffect(() => {
    ;(() => {
      if (loading) return
      setRows(getRows(positions))
    })()
  }, [loading, account, positions])

  if (!account) {
    return (
      <MyPositionsBorrowTableContainer>
        <EmptyState reason="no-wallet" />
      </MyPositionsBorrowTableContainer>
    )
  }
  if (loading) {
    return (
      <MyPositionsBorrowTableContainer>
        <TableRow sx={{ height: "2.625rem" }}>
          {new Array(7).fill("").map((_, index) => (
            <TableCell key={index}>
              <Skeleton />
            </TableCell>
          ))}
        </TableRow>
      </MyPositionsBorrowTableContainer>
    )
  }

  function handleClick(row: PositionRow) {
    const entity = vaultFromAddress(row.address)
    showPosition(router, String(entity?.chainId), entity)
  }

  return (
    <MyPositionsBorrowTableContainer>
      {rows.length > 0 ? (
        rows.map((row, i) => (
          <TableRow
            key={i}
            sx={{ cursor: "pointer" }}
            onClick={() => handleClick(row)}
          >
            <TableCell>
              <Stack direction="row" alignItems="center">
                <TokenWithNetworkIcon
                  token={row.debt.symbol}
                  network={chainName(row.chainId)}
                  innertTop="1.1rem"
                />
                {row.debt.symbol}
              </Stack>
            </TableCell>
            <TableCell>
              <Stack direction="row" alignItems="center" gap={1}>
                <TokenIcon
                  token={row.collateral.symbol}
                  width={32}
                  height={32}
                />
                {row.collateral.symbol}
              </Stack>
            </TableCell>
            <TableCell align="right">
              <Typography variant="small" color={palette.warning.main}>
                {row.apr}%
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Box pt={1} pb={1}>
                <Typography variant="small">
                  {formatValue(row.debt.usdValue, {
                    style: "currency",
                    minimumFractionDigits: 0,
                  })}
                </Typography>
                <br />
                <Typography variant="small" color={palette.info.main}>
                  {formatValue(row.debt.amount)} {row.debt.symbol}
                </Typography>
              </Box>
            </TableCell>
            <TableCell align="right">
              <Box pt={1} pb={1}>
                <Typography variant="small">
                  {formatValue(row.collateral.usdValue, {
                    style: "currency",
                    maximumFractionDigits: 0,
                  })}
                </Typography>
                <br />
                <Typography variant="small" color={palette.info.main}>
                  {formatValue(row.collateral.amount)} {row.collateral.symbol}
                </Typography>
              </Box>
            </TableCell>
            <TableCell align="right">
              {formatValue(row.oraclePrice, {
                style: "currency",
                minimumFractionDigits: 0,
              })}
            </TableCell>
            <LiquidationBox
              liquidationPrice={row.liquidationPrice}
              percentPriceDiff={row.percentPriceDiff}
            />
          </TableRow>
        ))
      ) : (
        <EmptyState reason="no-positions" />
      )}
    </MyPositionsBorrowTableContainer>
  )
}

export default MyPositionsBorrowTable

type PositionsBorrowTableElementProps = {
  children: string | JSX.Element | JSX.Element[]
}

function MyPositionsBorrowTableHeader() {
  return (
    <TableHead>
      <TableRow sx={{ height: "2.625rem" }}>
        <TableCell>Borrow</TableCell>
        <TableCell>Collateral</TableCell>
        <TableCell align="right">Debt APR</TableCell>
        <TableCell align="right">Borrowed</TableCell>
        <TableCell align="right">Collateral value</TableCell>
        <TableCell align="right">Oracle price</TableCell>
        <TableCell align="right">Liquidation Price</TableCell>
      </TableRow>
    </TableHead>
  )
}

function MyPositionsBorrowTableContainer({
  children,
}: PositionsBorrowTableElementProps) {
  return (
    <TableContainer>
      <Table aria-label="Positions table" size="small">
        <MyPositionsBorrowTableHeader />
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  )
}

function LiquidationBox(props: {
  liquidationPrice: number | "-"
  percentPriceDiff: number | "-"
}) {
  const { palette } = useTheme()
  const displayPercent = () => {
    if (props.liquidationPrice === 0 || props.liquidationPrice === "-") {
      return <span>No debt</span>
    } else {
      return (
        <span>
          <Typography variant="small" color={palette.success.main}>
            ~{props.percentPriceDiff}%{" "}
          </Typography>
          <Typography variant="small" color={palette.info.main}>
            above
          </Typography>
        </span>
      )
    }
  }
  return (
    <TableCell align="right">
      <Box pt={1} pb={1}>
        <Typography variant="small">
          {formatValue(props.liquidationPrice, {
            style: "currency",
            minimumFractionDigits: 0,
          })}
        </Typography>
        <br />
        {displayPercent()}
      </Box>
    </TableCell>
  )
}

function EmptyState({ reason }: { reason: "no-wallet" | "no-positions" }) {
  const { palette } = useTheme()

  const router = useRouter()

  const login = useAuth((state) => state.login, shallow)

  const config = useMemo(() => {
    return reason === "no-wallet"
      ? {
          title: "No wallet connected",
          infoText: <></>,
          button: {
            label: "Connect Wallet",
            action: login,
          },
        }
      : {
          title: "No Positions",
          infoText: (
            <Typography
              variant="smallDark"
              mt="0.5rem"
              sx={{
                whiteSpace: "normal",
              }}
            >
              Deposit and borrow in a vault to view your dashboard metrics
            </Typography>
          ),
          button: {
            label: "Borrow",
            action: () => router.push("/borrow"),
          },
        }
  }, [reason, login, router])

  return (
    <TableRow>
      <TableCell
        colSpan={7}
        align="center"
        sx={{ m: "0", textAlign: "center", p: 0 }}
      >
        <Box
          sx={{
            minHeight: "25rem",
            display: "flex",
            flexDirection: "column",
            pt: "3rem",
            justifyContent: "start",
            alignItems: "center",
            overflow: "hidden",
            ["@media screen and (max-width:700px)"]: {
              maxWidth: "90vw",
              minHeight: "15rem",
              p: "3rem 1rem 0 1rem",
            },
          }}
        >
          <Typography variant="h4" color={palette.text.primary}>
            {config.title}
          </Typography>

          {config.infoText}

          <Button
            variant="gradient"
            size="large"
            onClick={() => config.button.action()}
            data-cy="connect-wallet"
            fullWidth
            sx={{ mt: "1.5rem", maxWidth: "17rem" }}
          >
            {config.button.label}
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  )
}
