import {
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
import { useState } from "react"

export type Row = {
  borrow?: string | null
  collateral?: string | null
  bestRateChain: string
  supplyAPI: number
  borrowABR: number
  integratedProtocols: string[]
  safetyRating: string
  availableLiquidity: number
  children?: Row[]
  isChild: boolean
  isGrandChild: boolean
}

const rows: Row[] = [
  {
    borrow: "DAI",
    collateral: "ETH",
    bestRateChain: "Ethereum",
    supplyAPI: 1.8,
    borrowABR: 2.25,
    integratedProtocols: ["AAVE", "COMP"],
    safetyRating: "A+",
    availableLiquidity: 164800,
    isChild: false,
    isGrandChild: false,
  },
  {
    borrow: "USDC",
    collateral: "ETH",
    bestRateChain: "Ethereum",
    supplyAPI: 1.8,
    borrowABR: 2.55,
    integratedProtocols: ["AAVE", "COMP"],
    safetyRating: "A+",
    availableLiquidity: 164800,
    isChild: false,
    isGrandChild: false,
    children: [
      {
        borrow: null,
        collateral: null,
        bestRateChain: "Ethereum",
        supplyAPI: 1.8,
        borrowABR: 2.55,
        integratedProtocols: ["AAVE", "COMP"],
        safetyRating: "A+",
        availableLiquidity: 24800,
        isChild: true,
        isGrandChild: false,
      },
      {
        borrow: null,
        collateral: null,
        bestRateChain: "Polygon",
        supplyAPI: 1.5,
        borrowABR: 2.75,
        integratedProtocols: ["AAVE", "COMP"],
        safetyRating: "A+",
        availableLiquidity: 124800,
        isChild: true,
        isGrandChild: false,
      },
      {
        borrow: null,
        collateral: null,
        bestRateChain: "Fantom",
        supplyAPI: 1.5,
        borrowABR: 2.95,
        integratedProtocols: ["AAVE", "COMP"],
        safetyRating: "A+",
        availableLiquidity: 24800,
        isChild: true,
        isGrandChild: false,
      },
      {
        borrow: null,
        collateral: null,
        bestRateChain: "Optimism",
        supplyAPI: 1.3,
        borrowABR: 2.98,
        integratedProtocols: ["AAVE", "COMP"],
        safetyRating: "A+",
        availableLiquidity: 88000,
        isChild: true,
        isGrandChild: false,
      },
      {
        borrow: null,
        collateral: null,
        bestRateChain: "Arbitrum",
        supplyAPI: 1.3,
        borrowABR: 2.99,
        integratedProtocols: ["AAVE", "COMP"],
        safetyRating: "A+",
        availableLiquidity: 100000,
        isChild: true,
        isGrandChild: false,
        children: [
          {
            borrow: null,
            collateral: null,
            bestRateChain: "Arbitrum",
            supplyAPI: 1.3,
            borrowABR: 3.01,
            integratedProtocols: ["AAVE", "COMP"],
            safetyRating: "A+",
            availableLiquidity: 100000,
            isChild: true,
            isGrandChild: true,
          },
          {
            borrow: null,
            collateral: null,
            bestRateChain: "Arbitrum",
            supplyAPI: 1.3,
            borrowABR: 3.02,
            integratedProtocols: ["WPC", "IB", "SONNE", "COMP", "COMP", "AAVE"],
            safetyRating: "B+",
            availableLiquidity: 100000,
            isChild: true,
            isGrandChild: true,
          },
        ],
      },
    ],
  },
  {
    borrow: "USDC",
    collateral: "ETH",
    bestRateChain: "Ethereum",
    supplyAPI: 1.8,
    borrowABR: 2.55,
    integratedProtocols: ["AAVE", "COMP"],
    safetyRating: "A+",
    availableLiquidity: 24800,
    isChild: false,
    isGrandChild: false,
  },
  {
    borrow: "USDT",
    collateral: "ETH",
    bestRateChain: "Ethereum",
    supplyAPI: 1.8,
    borrowABR: 2.65,
    integratedProtocols: ["WPC", "IB", "SONNE", "COMP", "COMP", "AAVE"],
    safetyRating: "B+",
    availableLiquidity: 164800,
    isChild: false,
    isGrandChild: false,
  },
]

export default function MarketsTable() {
  const { palette } = useTheme()
  const [aprSorting, setAprSorting] = useState("descending")

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
                  setAprSorting(
                    aprSorting === "ascending" ? "descending" : "ascending"
                  )
                }
              >
                <span>Borrow APR</span>
                {aprSorting === "descending" ? (
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
                      <a
                        href="https://docs.fujidao.org/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <u> here</u>
                      </a>
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
