import {
  CircularProgress,
  Link,
  Stack,
  Table,
  TableBody,
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
import {
  BorrowingVaultWithFinancials,
  LendingProviderDetails,
} from "@x-fuji/sdk"
import { chainName } from "../../helpers/chainName"
import { SizableTableCell } from "../SizableTableCell"

export type Row = {
  borrow: string
  collateral: string

  chain: string

  supplyApy: number
  supplyApyBase: number
  supplyApyReward: number

  borrowApr: number
  borrowAprBase: number
  borrowAprReward: number

  integratedProtocols: string[]
  safetyRating: string
  availableLiquidity: number
  children?: Row[]
  isChild: boolean
}

type SortBy = "descending" | "ascending"
// Map a vault address to its providers
type ProvidersMap = Record<string, LendingProviderDetails[]>

export default function MarketsTable() {
  const { palette } = useTheme()
  const [appSorting] = useState<SortBy>("descending")
  const [vaults, setVaults] = useState<BorrowingVaultWithFinancials[]>([])
  const [providers, setProviders] = useState<ProvidersMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVaults() {
      try {
        const vaults = await sdk.getAllVaultsWithFinancials()
        if (!vaults) throw "error on sdk: empty resoponse"

        console.time("getProviders")
        const allProviders = await Promise.all(
          vaults.map((v) => v.vault.getProviders())
        )
        const providers: ProvidersMap = {}
        for (let i = 0; i < allProviders.length; i++) {
          const address = vaults[i].vault.address.value
          providers[address] = allProviders[i]
        }
        console.timeEnd("getProviders")
        setVaults(vaults)
        setProviders(providers)
        setLoading(false)
      } catch (e) {
        // TODO: What if error
        setLoading(false)
      }
    }
    fetchVaults()
  }, [])

  const rawRows = vaults.map((v) =>
    vaultToRow(v, providers[v.vault.address.value])
  )
  const rows: Row[] = groupByPair(rawRows)
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
            <SizableTableCell
              width="160px"
              sx={{
                position: "sticky",
                left: 0,
                zIndex: 1,
                background: palette.secondary.contrastText,
                pl: "48px",
              }}
              align="left"
            >
              Borrow
            </SizableTableCell>
            <SizableTableCell align="left" width="120px">
              Collateral
            </SizableTableCell>
            <SizableTableCell width="200px" align="left" sx={{ pl: "48px" }}>
              Chain with the best rate
            </SizableTableCell>
            <SizableTableCell width="140px" align="right">
              Supply APY
            </SizableTableCell>
            <SizableTableCell width="140px" align="right">
              <Stack
                direction="row"
                spacing="0.25rem"
                alignItems="center"
                justifyContent="right"
                // Disabling app sorting for 1st iteration
                // sx={{ cursor: "pointer" }}
                // onClick={() =>
                //   setAppSorting(
                //     appSorting === "ascending" ? "descending" : "ascending"
                //   )
                // }
              >
                <span>Borrow APR</span>
                {appSorting === "descending" ? (
                  <KeyboardArrowUpIcon
                    sx={{ color: palette.info.main, fontSize: "0.875rem" }}
                  />
                ) : (
                  <KeyboardArrowDownIcon
                    sx={{ color: palette.info.main, fontSize: "0.875rem" }}
                  />
                )}
              </Stack>
            </SizableTableCell>
            <SizableTableCell align="right" width="140px">
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
                    sx={{ fontSize: "0.875rem", color: palette.info.main }}
                  />
                </Tooltip>
                <span>Protocols</span>
              </Stack>
            </SizableTableCell>
            <SizableTableCell width="140px">
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
            </SizableTableCell>
            <SizableTableCell width="140px" align="right">
              Liquidity
            </SizableTableCell>
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

function vaultToRow(
  vault: BorrowingVaultWithFinancials,
  providers: LendingProviderDetails[]
): Row {
  // TODO: here only to test on dev mode, we need to mock this cuz we don't have any rewards on testnets
  if (
    vault.vault.address.value === "0xDdd86428204f12f296954c9CdFC73F3275f0D8a0"
  ) {
    vault.borrowApyReward = 0.42
    vault.depositApyReward = 0.42
    vault.depositApy = vault.depositApyReward + vault.depositApyBase
    console.warn("Adding fake reward into vault", vault)
  }

  return {
    borrow: vault.vault.debt.symbol,
    collateral: vault.vault.collateral.symbol,
    chain: chainName(vault.vault.chainId),

    supplyApy: vault.depositApy,
    supplyApyBase: vault.depositApyBase,
    supplyApyReward: vault.depositApyReward,

    borrowApr: vault.borrowApyBase - vault.borrowApyReward,
    borrowAprBase: vault.borrowApyBase,
    borrowAprReward: vault.borrowApyReward,

    integratedProtocols: providers.map((p) => p.name),
    safetyRating: "A+",
    availableLiquidity: vault.availableToBorrowUSD,
    isChild: false,
  }
}

function groupByPair(rows: Row[]): Row[] {
  const done = new Set<string>() // Pair is symbol/symbol i.e WETH/USDC
  const grouped: Row[] = []

  for (const row of rows) {
    const key = `${row.borrow}/${row.collateral}`
    if (done.has(key)) continue
    done.add(key)

    const entries = rows.filter(
      (r) => r.borrow === row.borrow && r.collateral === row.collateral
    )
    if (entries.length > 1) {
      // TODO: array should be sorted before being grouped
      const sorted = entries.sort(sortBy.descending)
      const children = groupByChain(
        sorted.map((r) => ({ ...r, isChild: true }))
      )
      grouped.push({ ...sorted[0], children })
    } else {
      grouped.push(entries[0])
    }
  }

  return grouped
}

function groupByChain(rows: Row[]): Row[] {
  const done = new Set<string>() // Pair is symbol/symbol i.e WETH/USDC
  const grouped: Row[] = []

  for (const row of rows) {
    const key = row.chain
    if (done.has(key)) continue
    done.add(key)

    const entries = rows.filter((r) => r.chain === row.chain)
    if (entries.length > 1) {
      // TODO: array should be sorted before being grouped
      const sorted = entries.sort(sortBy.descending)
      const children = sorted.map((r) => ({ ...r, isChild: true }))
      grouped.push({ ...sorted[0], children })
    } else {
      grouped.push(entries[0])
    }
  }

  return grouped
}

type CompareFn = (r1: Row, r2: Row) => 1 | -1

const sortBy: Record<SortBy, CompareFn> = {
  ascending: (a, b) => (a.borrowApr < b.borrowApr ? 1 : -1),
  descending: (a, b) => (a.borrowApr > b.borrowApr ? 1 : -1),
}
