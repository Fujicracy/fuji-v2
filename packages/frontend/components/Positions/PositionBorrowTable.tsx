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
} from "@mui/material"
import { TokenIcon } from "../Shared/Icons"
import { Position } from "../../store/models/Position"
import { usePositions } from "../../store/positions.store"

type Row = {
  borrow: { sym: string | "-"; amount: number | "-"; usdValue: number | 1 }
  collateral: { sym: string | "-"; amount: number | "-"; usdValue: number | 1 }
  apr: number | "-"
  liquidationPrice: number | "-"
  oraclePrice: number | "-"
  percentPriceDiff: number | "-"
}

const emptyRows: Row[] = []

function getRows(positions: Position[]): Row[] {
  if (positions.length == 0) {
    return emptyRows
  } else {
    const rows: Row[] = positions.map((pos: Position) => ({
      borrow: {
        sym: pos.vault?.debt.symbol || "",
        amount: pos.debt.amount,
        usdValue: pos.debt.usdValue,
      },
      collateral: {
        sym: pos.vault?.collateral.symbol || "",
        amount: pos.collateral.amount,
        usdValue: pos.collateral.usdValue,
      },
      apr: formatNumber(pos.debt.baseAPR, 2),
      liquidationPrice: handleDisplayLiquidationPrice(pos.liquidationPrice),
      oraclePrice: formatNumber(
        pos.collateral.usdValue / pos.collateral.amount,
        0
      ),
      get percentPriceDiff() {
        if (this.liquidationPrice == "-" || this.oraclePrice == "-") {
          return 0
        } else {
          return formatNumber(
            ((this.oraclePrice - this.liquidationPrice) * 100) /
              this.oraclePrice,
            0
          )
        }
      },
    }))
    return rows
  }
}

function handleDisplayLiquidationPrice(liqPrice_: number | undefined) {
  if (liqPrice_ == undefined || liqPrice_ == 0) {
    return "-"
  } else {
    return formatNumber(liqPrice_, 0)
  }
}

function formatNumber(
  num: number | undefined,
  decimals_: number
): number | "-" {
  if (num == undefined) {
    return "-"
  } else {
    return parseFloat(num.toFixed(decimals_))
  }
}

function LiquidationBox(props: {
  liquidationPrice: number | "-"
  percentPriceDiff: number | "-"
}) {
  const { palette } = useTheme()
  const displayPercent = () => {
    if (props.liquidationPrice == 0 || props.liquidationPrice == "-") {
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
          {props.liquidationPrice.toLocaleString("en-US", {
            style: "currency",
            currency: "usd",
            minimumFractionDigits: 0,
          })}
        </Typography>
        <br />
        {displayPercent()}
      </Box>
    </TableCell>
  )
}

export function PositionsBorrowTable() {
  const { palette } = useTheme()

  const positions = usePositions((state) => state.positions)
  const [rows, setRows] = useState(emptyRows)

  useEffect(() => {
    if (positions.length > 0) {
      const fetchedRows = getRows(positions)
      setRows(fetchedRows)
    }
  }, [positions])

  return (
    <TableContainer>
      <Table aria-label="Positions table" size="small">
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
        <TableBody>
          {rows.map((row) => (
            // TODO: key should  be smth else unique to a row, maybe the vault address ?
            <TableRow key={row.liquidationPrice}>
              <TableCell>
                <Stack direction="row" alignItems="center" gap={1}>
                  <TokenIcon token={row.borrow.sym} width={32} height={32} />
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
                  {row.apr}%
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Box pt={1} pb={1}>
                  <Typography variant="small">
                    {row.borrow.usdValue.toLocaleString("en-US", {
                      style: "currency",
                      currency: "usd",
                      minimumFractionDigits: 0,
                    })}
                  </Typography>
                  <br />
                  <Typography variant="small" color={palette.info.main}>
                    {row.borrow.amount.toLocaleString("en-US")} {row.borrow.sym}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                <Box pt={1} pb={1}>
                  <Typography variant="small">
                    {row.collateral.usdValue.toLocaleString("en-US", {
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
              <LiquidationBox
                liquidationPrice={row.liquidationPrice}
                percentPriceDiff={row.percentPriceDiff}
              />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
