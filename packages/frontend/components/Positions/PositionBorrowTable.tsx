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
import { chainName } from "../../services/chains"
import { usePositions } from "../../store/positions.store"
import { useAuth } from "../../store/auth.store"
import { getRows, PositionRow } from "../../helpers/positions"
import { formatValue } from "../../helpers/values"
import { useBorrow } from "../../store/borrow.store"
import { navigateToVault } from "../../helpers/navigation"

type PositionsBorrowTableProps = {
  loading: boolean
}

export function PositionsBorrowTable({ loading }: PositionsBorrowTableProps) {
  const { palette } = useTheme()
  const router = useRouter()
  const account = useAuth((state) => state.address)
  const positions = usePositions((state) => state.positions)
  const vaults = useBorrow((state) => state.availableVaults)
  const changeAll = useBorrow((state) => state.changeAll)
  const [rows, setRows] = useState<PositionRow[]>([])

  useEffect(() => {
    ;(() => {
      if (loading) return
      setRows(getRows(positions))
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
            <Skeleton height={40} />
          </TableCell>
        </TableRow>
      </PositionBorrowTableContainer>
    )
  }

  function handleClick(row: PositionRow) {
    const entity = vaults.find((v) => v.address.value === row.address)
    // TODO: This is collateral's chain id. How do we get it here?
    navigateToVault(
      router,
      String(entity?.chainId),
      positions,
      changeAll,
      entity
    )
  }

  return (
    <PositionBorrowTableContainer>
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
                  token={row.borrow.sym}
                  network={chainName(row.chainId)}
                  innertTop="1.1rem"
                />
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
                  {formatValue(row.borrow.usdValue, {
                    style: "currency",
                    minimumFractionDigits: 0,
                  })}
                </Typography>
                <br />
                <Typography variant="small" color={palette.info.main}>
                  {formatValue(row.borrow.amount)} {row.borrow.sym}
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
                  {formatValue(row.collateral.amount)} {row.collateral.sym}
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

  // handleClick =

  return (
    <TableRow
      sx={{ height: "2.625rem" }}
      onClick={() => handleClick(row.entity)}
    >
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
