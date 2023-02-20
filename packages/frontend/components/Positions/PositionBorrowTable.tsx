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
  LinearProgress,
  Button,
} from "@mui/material"
import { useRouter } from "next/router"
import { TokenIcon, NetworkIcon } from "../Shared/Icons"
import { chainName } from "../../services/chains"
import { usePositions } from "../../store/positions.store"
import { useAuth } from "../../store/auth.store"
import { emptyRows, getRows } from "../../helpers/positions"

type PositionsBorrowTableProps = {
  loading: boolean
}

export function PositionsBorrowTable({ loading }: PositionsBorrowTableProps) {
  const { palette } = useTheme()

  const account = useAuth((state) => state.address)
  const positions = usePositions((state) => state.positions)
  const [rows, setRows] = useState(emptyRows)

  useEffect(() => {
    ;(() => {
      if (loading) return
      setRows(positions.length > 0 ? getRows(positions) : emptyRows)
    })()
  }, [loading, account, positions])

  if (!account) {
    return (
      <PositionBorrowTableContainer>
        <PositionBorrowTableRow>No wallet detected</PositionBorrowTableRow>
      </PositionBorrowTableContainer>
    )
  }
  if (loading) {
    return (
      <PositionBorrowTableContainer>
        <TableRow sx={{ height: "2.625rem" }}>
          <TableCell colSpan={10} align="center">
            <LinearProgress sx={{ height: "1.5rem" }} color="secondary" />
          </TableCell>
        </TableRow>
      </PositionBorrowTableContainer>
    )
  }
  return (
    <PositionBorrowTableContainer>
      {rows.length > 0 ? (
        rows.map((row) => (
          // TODO: key should  be smth else unique to a row, maybe the vault address ?
          <TableRow key={row.liquidationPrice}>
            <TableCell>
              <Stack direction="row" alignItems="center" gap={1}>
                <Stack direction="row">
                  <TokenIcon token={row.borrow.sym} width={32} height={32} />
                  <NetworkIcon
                    network={chainName(row.chainId)}
                    height={16}
                    width={16}
                    sx={{
                      position: "relative",
                      right: "0.75rem",
                      top: "1.5rem",
                      border: "0.5px solid white",
                      borderRadius: "100%",
                      height: "17px",
                      width: "17px",
                    }}
                  />
                </Stack>
                {row.borrow.sym}
              </Stack>
            </TableCell>
            <TableCell>
              <Stack direction="row" alignItems="center" gap={1}>
                <TokenIcon token={row.collateral.sym} width={32} height={32} />
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
        ))
      ) : (
        <PositionBorrowTableRow>No open positions</PositionBorrowTableRow>
      )}
    </PositionBorrowTableContainer>
  )
}

type PositionsBorrowTableElementProps = {
  children: string | JSX.Element | JSX.Element[]
}

function PositionBorrowTableRow({
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
        {account != undefined && (
          <Button
            variant="secondary2"
            sx={buttonSx}
            onClick={() => {
              router.push("/borrow")
            }}
          >
            Go open a position
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

function PositionBorrowTableHeader() {
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

function PositionBorrowTableContainer({
  children,
}: PositionsBorrowTableElementProps) {
  return (
    <TableContainer>
      <Table aria-label="Positions table" size="small">
        <PositionBorrowTableHeader />
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
