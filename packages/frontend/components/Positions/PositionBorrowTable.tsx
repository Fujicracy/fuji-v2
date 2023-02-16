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
  apy: number | "-"
  liquidationPrice: number | "-"
  oraclePrice: number | "-"
}

const fakeRows: Row[] = [
  {
    borrow: { sym: "DAI", amount: 8500, usdValue: 8500 },
    collateral: { sym: "ETH", amount: 10, usdValue: 20000 },
    apy: 2.25,
    liquidationPrice: 1500,
    oraclePrice: 2000,
  },
  {
    borrow: { sym: "USDT", amount: 6000, usdValue: 6000 },
    collateral: { sym: "ETH", amount: 10, usdValue: 20000 },
    apy: 2.25,
    liquidationPrice: 1501,
    oraclePrice: 2000,
  },
]

function getRows(positions: Position[]): Row[] {
  if (positions.length == 0) {
    return fakeRows
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
      apy: 2.25,
      liquidationPrice: 1500,
      oraclePrice: 2000,
    }))
    return rows
  }
}

export function PositionsBorrowTable() {
  const { palette } = useTheme()

  const positions = usePositions((state) => state.positions)
  const rows: Row[] = getRows(positions)

  return (
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
                  {row.apy}%
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
                  <Typography variant="small" color={palette.success.main}>
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
  )
}
