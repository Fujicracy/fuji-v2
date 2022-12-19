import {
  CircularProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  useTheme,
} from "@mui/material"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import MarketsTableRow from "./MarketsTableRow"
import { useEffect, useState } from "react"
import { sdk } from "../../store/auth.slice"
import { BorrowingVaultWithFinancials } from "@x-fuji/sdk"

export type Row = {
  borrow?: string | null
  collateral?: string | null
  bestRateChain: string
  supplyAPI: number
  borrowAPR: number
  integratedProtocols: string[]
  safetyRating: string
  availableLiquidity: number
  children?: Row[]
  isChild: boolean
}

type SortBy = "descending" | "ascending"

export default function MarketsTable() {
  const { palette } = useTheme()
  const [appSorting, setAppSorting] = useState<SortBy>("descending")
  const [vaults, setVaults] = useState<void | BorrowingVaultWithFinancials[]>(
    []
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVaults() {
      try {
        const v = await sdk.getAllVaultsWithFinancials()
        setVaults(v)
        setLoading(false)
      } catch (e) {
        // TODO: What if error
        setLoading(false)
      }
    }
    fetchVaults()
  }, [])

  const rows: Row[] = vaults
    ? vaults.map(vaultToRow).sort(sortBy[appSorting])
    : []
  console.log({ vaults, rows })

  if (loading) {
    return (
      <Stack direction="row" justifyContent="center">
        <CircularProgress sx={{ color: palette.primary.main }} />
      </Stack>
    )
  }
  return (
    <TableContainer>
      <Table
        aria-label="Markets table"
        sx={{
          // border-collapse fix bug on borders on firefox with sticky column
          borderCollapse: "initial",
          ".MuiTableCell-root": {
            minWidth: "160px",
          },
        }}
      >
        <TableHead>
          <TableRow sx={{ height: "2.625rem" }}>
            <TableCell
              sx={{
                position: "sticky",
                left: 0,
                zIndex: 1,
                background: palette.secondary.contrastText,
              }}
              align="center"
            >
              Borrow
            </TableCell>
            <TableCell align="center">Collateral</TableCell>
            <TableCell align="center">Chain with the best rate</TableCell>
            <TableCell align="right">Supply APY</TableCell>
            <TableCell align="right">
              <Stack
                direction="row"
                spacing="0.25rem"
                alignItems="center"
                justifyContent="right"
                sx={{ cursor: "pointer" }}
                onClick={() =>
                  setAppSorting(
                    appSorting === "ascending" ? "descending" : "ascending"
                  )
                }
              >
                <span>Borrow APR</span>
                {appSorting === "descending" ? (
                  <KeyboardArrowUpIcon
                    sx={{
                      color: palette.info.main,
                      fontSize: "0.875rem",
                    }}
                  />
                ) : (
                  <KeyboardArrowDownIcon
                    sx={{
                      color: palette.info.main,
                      fontSize: "0.875rem",
                    }}
                  />
                )}
              </Stack>
            </TableCell>
            <TableCell align="right">
              <Stack
                direction="row"
                alignItems="center"
                spacing="0.25rem"
                justifyContent="right"
              >
                <Tooltip
                  arrow
                  title="FujiV2 refinances between these protocols to find the best yield"
                  placement="top"
                >
                  <InfoOutlinedIcon
                    sx={{
                      fontSize: "0.875rem",
                      color: palette.info.main,
                    }}
                  />
                </Tooltip>
                <span>Protocols</span>
              </Stack>
            </TableCell>
            <TableCell>
              <Stack
                direction="row"
                alignItems="center"
                spacing="0.25rem"
                justifyContent="right"
              >
                <Tooltip
                  arrow
                  title={
                    <span>
                      We take into account variables such as liquidity, audits
                      and team behind each protocol, you can read more on our
                      risk framework{" "}
                      <Link
                        href="https://docs.fujidao.org/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <u> here</u>
                      </Link>
                    </span>
                  }
                  placement="top"
                >
                  <InfoOutlinedIcon
                    sx={{ fontSize: "0.875rem", color: palette.info.main }}
                  />
                </Tooltip>
                <span>Safety Rating</span>
              </Stack>
            </TableCell>
            <TableCell align="right">Liquidity</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <MarketsTableRow key={i} row={row} extra={i === 0} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function vaultToRow(vault: BorrowingVaultWithFinancials): Row {
  return {
    borrow: vault.vault.debt.symbol,
    collateral: vault.vault.collateral.symbol,
    bestRateChain: "Ethereum",
    supplyAPI: vault.depositApyBase,
    borrowAPR: vault.borrowApyBase,
    integratedProtocols: ["AAVE", "COMP"],
    safetyRating: "A+",
    availableLiquidity: vault.availableToBorrowUSD,
    isChild: false,
  }
}

type CompareFn = (r1: Row, r2: Row) => 1 | -1

const sortBy: Record<SortBy, CompareFn> = {
  ascending: (a, b) => (a.borrowAPR < b.borrowAPR ? 1 : -1),
  descending: (a, b) => (a.borrowAPR > b.borrowAPR ? 1 : -1),
}
