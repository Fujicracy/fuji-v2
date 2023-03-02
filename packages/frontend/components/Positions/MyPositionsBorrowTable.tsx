import { useEffect, useState } from "react"
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
import { getRows, PositionRow } from "../../helpers/positions"
import { formatValue } from "../../helpers/values"
import { navigateToVault } from "../../helpers/navigation"

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
        <MyPositionsBorrowTableRow>
          No wallet detected
        </MyPositionsBorrowTableRow>
      </MyPositionsBorrowTableContainer>
    )
  }
  if (loading) {
    return (
      <MyPositionsBorrowTableContainer>
        <TableRow sx={{ height: "2.625rem" }}>
          <TableCell>
            <Skeleton />
          </TableCell>
          <TableCell>
            <Skeleton />
          </TableCell>
          <TableCell>
            <Skeleton />
          </TableCell>
          <TableCell>
            <Skeleton />
          </TableCell>
          <TableCell>
            <Skeleton />
          </TableCell>
          <TableCell>
            <Skeleton />
          </TableCell>
          <TableCell>
            <Skeleton />
          </TableCell>
        </TableRow>
      </MyPositionsBorrowTableContainer>
    )
  }

  function handleClick(row: PositionRow) {
    const entity = positions
      .map((p) => p.vault)
      .find((v) => v?.address.value === row.address)
    navigateToVault(router, String(entity?.chainId), entity)
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
        <MyPositionsBorrowTableRow>No open positions</MyPositionsBorrowTableRow>
      )}
    </MyPositionsBorrowTableContainer>
  )
}

export default MyPositionsBorrowTable

type PositionsBorrowTableElementProps = {
  children: string | JSX.Element | JSX.Element[]
}

function MyPositionsBorrowTableRow({
  children,
}: PositionsBorrowTableElementProps) {
  const { palette } = useTheme()
  const router = useRouter()
  const account = useAuth((state) => state.address)

  const buttonSx = {
    padding: "6px 16px 5px",
    lineHeight: "0.875rem",
    fontSize: "0.875rem",
    backgroundColor: palette.secondary.main,
    border: "none",
  }

  return (
    <TableRow sx={{ height: "2.625rem" }}>
      <TableCell></TableCell>
      <TableCell colSpan={5} align="center">
        {children}
      </TableCell>
      <TableCell align="right">
        {account && (
          <Button
            variant="primary"
            sx={buttonSx}
            onClick={() => {
              router.push("/borrow")
            }}
          >
            Open position
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
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
