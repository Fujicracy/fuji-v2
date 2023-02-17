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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import MarketsTableRow from "./MarketsTableRow"
import { useEffect, useState } from "react"
import { Address, BorrowingVault, VaultWithFinancials } from "@x-fuji/sdk"
import { useAuth } from "../../store/auth.store"
import { chainName } from "../../services/chains"
import { sdk } from "../../services/sdk"
import { SizableTableCell } from "../Shared/SizableTableCell"
import { BigNumber } from "ethers"

export type Row = {
  vault: BorrowingVault

  borrow: string
  collateral: string

  chain: string

  depositApy: number
  depositApyBase: number
  depositApyReward: number

  borrowApy: number
  borrowApyBase: number
  borrowApyReward: number

  integratedProtocols: string[]
  safetyRating: string
  liquidity: number | "loading" | "error"
  children?: Row[]
  isChild: boolean
  isGrandChild: boolean // TODO: Not handled
}

type SortBy = "descending" | "ascending"

export default function MarketsTable() {
  const { palette } = useTheme()
  const address = useAuth((state) => state.address)
  // const [appSorting] = useState<SortBy>("descending")
  const [vaults, setVaults] = useState<VaultWithFinancials[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const addr = address ? Address.from(address) : undefined
        let vaults = await sdk.getBorrowingVaultsFinancials(addr)
        setVaults(vaults)
        setLoading(false)
        vaults = await sdk.getLlamaFinancials(vaults)
        setVaults(vaults)
      } catch (e) {
        const vaults = sdk.getAllBorrowingVaults().map((v) => ({
          vault: v,
          allProviders: [],
          activeProvider: { name: "", llamaKey: "" },
          depositBalance: BigNumber.from(0),
          borrowBalance: BigNumber.from(0),
          collateralPriceUSD: BigNumber.from(0),
          debtPriceUSD: BigNumber.from(0),
        }))
        setVaults(vaults)
        setLoading(false)
      }
    })()
  }, [address])

  const rows: Row[] = groupByPair(vaults.map(vaultToRow))

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
        // border-collapse fix bug on borders on firefox with sticky column
        sx={{ borderCollapse: "initial" }}
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
                <span>Borrow APY</span>
                {/* {appSorting === "descending" ? (
                  <KeyboardArrowUpIcon
                    sx={{ color: palette.info.main, fontSize: "0.875rem" }}
                  />
                ) : (
                  <KeyboardArrowDownIcon
                    sx={{ color: palette.info.main, fontSize: "0.875rem" }}
                  />
                )} */}
              </Stack>
            </SizableTableCell>
            <SizableTableCell width="140px" align="right">
              Supply APY
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
                  title="Fuji refinances between these protocols to find the best yield"
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
            <MarketsTableRow key={i} row={row} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function vaultToRow(v: VaultWithFinancials): Row {
  const activeProvider = v.activeProvider
  const liquidity = activeProvider.availableToBorrowUSD
  const depositApyBase = activeProvider.depositApyBase ?? 0
  const depositApyReward = activeProvider.depositApyReward ?? 0
  const borrowApyBase = activeProvider.borrowApyBase ?? 0
  const borrowApyReward = activeProvider.borrowApyReward ?? 0
  return {
    vault: v.vault,

    borrow: v.vault.debt.symbol,
    collateral: v.vault.collateral.symbol,
    chain: chainName(v.vault.chainId),

    depositApy: depositApyBase + depositApyReward,
    depositApyBase,
    depositApyReward,

    borrowApy: borrowApyBase - borrowApyReward,
    borrowApyBase,
    borrowApyReward,

    integratedProtocols: v.allProviders.map((p) => p.name),
    safetyRating: "A",
    liquidity:
      liquidity === undefined
        ? "loading"
        : liquidity === 0
        ? "error"
        : liquidity,
    isChild: false,
    isGrandChild: false,
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
  ascending: (a, b) => (a.borrowApy < b.borrowApy ? 1 : -1),
  descending: (a, b) => (a.borrowApy > b.borrowApy ? 1 : -1),
}
