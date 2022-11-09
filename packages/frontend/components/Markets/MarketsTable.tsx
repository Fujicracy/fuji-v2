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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import MarketsTableRow from "./MarketsTableRow"

export type Row = {
  borrow?: string | null
  collateral?: string | null
  bestRateChain: string
  supplyAPI: number
  borrowABR: number
  integratedProtocols: string[]
  safetyRating: string
  availableLiquidity: number
  collaspsedRows?: Row[]
}

export default function MarketsTable() {
  const { palette } = useTheme()

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
      collaspsedRows: [
        {
          borrow: null,
          collateral: null,
          bestRateChain: "Ethereum",
          supplyAPI: 1.8,
          borrowABR: 2.55,
          integratedProtocols: ["AAVE", "COMP"],
          safetyRating: "A+",
          availableLiquidity: 24800,
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
          collaspsedRows: [
            {
              borrow: null,
              collateral: null,
              bestRateChain: "Arbitrum",
              supplyAPI: 1.3,
              borrowABR: 3.01,
              integratedProtocols: ["AAVE", "COMP"],
              safetyRating: "A+",
              availableLiquidity: 100000,
            },
            {
              borrow: null,
              collateral: null,
              bestRateChain: "Arbitrum",
              supplyAPI: 1.3,
              borrowABR: 3.02,
              integratedProtocols: [
                "WPC",
                "IB",
                "SONNE",
                "COMP",
                "COMP",
                "AAVE",
              ],
              safetyRating: "B+",
              availableLiquidity: 100000,
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
    },
  ]

  return (
    <TableContainer>
      <Table aria-label="Markets table">
        <TableHead>
          <TableRow sx={{ height: "2.625rem" }}>
            <TableCell
              sx={{
                position: "sticky",
                left: 0,
                width: "11.25rem",
                background: palette.secondary.contrastText,
              }}
              align="center"
            >
              Borrow
            </TableCell>
            <TableCell sx={{ width: "11.25rem" }} align="center">
              Collateral
            </TableCell>
            <TableCell align="center" sx={{ width: "11.25rem" }}>
              Chain with the best rate
            </TableCell>
            <TableCell align="center" sx={{ width: "8.75rem" }}>
              Supply APY
            </TableCell>
            <TableCell align="center" sx={{ width: "8.75rem" }}>
              <Stack
                direction="row"
                spacing="0.25rem"
                alignItems="center"
                justifyContent="center"
              >
                <span>Borrow APR</span>
                <KeyboardArrowUpIcon
                  sx={{ color: palette.info.main, fontSize: "0.875rem" }}
                />
              </Stack>
            </TableCell>
            <TableCell align="center" sx={{ width: "8.75rem" }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing="0.25rem"
                justifyContent="center"
              >
                <Tooltip
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
                <span>Integrated Protocols</span>
              </Stack>
            </TableCell>
            <TableCell align="center" sx={{ width: "8.75rem" }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing="0.25rem"
                justifyContent="center"
              >
                <Tooltip
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
                    sx={{
                      fontSize: "0.875rem",
                      color: palette.info.main,
                    }}
                  />
                </Tooltip>
                <span>Safety Rating</span>
              </Stack>
            </TableCell>
            <TableCell align="center" sx={{ width: "8.75rem" }}>
              Available Liquidity
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* TODO: Not sure for the key value */}
          {rows.map((row, i) => (
            <MarketsTableRow
              key={i + row.availableLiquidity}
              row={row}
              extra={i === 0}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
