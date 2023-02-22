import {
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
import { Address } from "@x-fuji/sdk"
import { useAuth } from "../../store/auth.store"
import { sdk } from "../../services/sdk"
import { SizableTableCell } from "../Shared/SizableTableCell"
import {
  groupByPair,
  MarketRow,
  setBase,
  setFinancials,
  setLlamas,
  Status,
} from "../../helpers/markets"

export default function MarketsTable() {
  const { palette } = useTheme()
  const address = useAuth((state) => state.address)
  // const [appSorting] = useState<SortBy>("descending")
  const [rows, setRows] = useState<MarketRow[]>([])

  useEffect(() => {
    const addr = address ? Address.from(address) : undefined

    const vaults = sdk.getAllBorrowingVaults()
    const rowsBase = vaults.map(setBase)
    setRows(groupByPair(rowsBase))
    ;(async () => {
      try {
        // try both calls
        const financials = await sdk.getBorrowingVaultsFinancials(addr)
        const rowsFin = financials.map((fin, i) =>
          setFinancials(rowsBase[i], Status.Ready, fin)
        )
        setRows(groupByPair(rowsFin))

        const llamas = await sdk.getLlamaFinancials(financials)
        const rowsLlama = llamas.map((llama, i) =>
          setLlamas(rowsFin[i], Status.Ready, llama)
        )
        setRows(groupByPair(rowsLlama))
      } catch (e) {
        try {
          // re-try the first one
          // set llamas to error, assuming in the first try llama failed
          const financials = await sdk.getBorrowingVaultsFinancials(addr)
          const rows = financials
            .map((fin, i) => setFinancials(rowsBase[i], Status.Ready, fin))
            .map((r) => setLlamas(r, Status.Error))
          setRows(groupByPair(rows))
        } catch (e) {
          // set both to errors
          const rows = rowsBase
            .map((r) => setFinancials(r, Status.Error))
            .map((r) => setLlamas(r, Status.Error))
          setRows(groupByPair(rows))
        }
      }
    })()
  }, [address])

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
                <span>Borrow APR</span>
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
            <SizableTableCell width="130px" align="right">
              Collateral APR
            </SizableTableCell>
            <SizableTableCell align="right" width="130px">
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
