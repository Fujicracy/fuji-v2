import {
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import Image from "next/image"
import MarketsTableRow from "./MarketsTableRow"

type Row = {
  borrow: React.ReactNode
  collateral: React.ReactNode
  bestRateChain: React.ReactNode
  supplyAPI: number
  borrowABR: number
  integratedProtocols: string[]
  safetyRating: string
  availableLiquidity: number
  collaspsedRows?: Row[]
}

export default function MarketsTable() {
  const { palette } = useTheme()

  function createData(
    borrow: React.ReactNode,
    collateral: React.ReactNode,
    bestRateChain: React.ReactNode,
    supplyAPI: number,
    borrowABR: number,
    integratedProtocols: string[],
    safetyRating: string,
    availableLiquidity: number,
    collaspsedRows?: Row[]
  ) {
    return {
      borrow,
      collateral,
      bestRateChain,
      supplyAPI,
      borrowABR,
      integratedProtocols,
      safetyRating,
      availableLiquidity,
      collaspsedRows,
    }
  }

  const rows = [
    createData(
      <Grid container alignItems="center">
        <Image
          src={`/assets/images/protocol-icons/tokens/DAI.svg`}
          height={32}
          width={32}
          alt="DAI"
        />
        <Typography ml="0.5rem" variant="small">
          DAI
        </Typography>
      </Grid>,
      <Grid container alignItems="center">
        <Image
          src={`/assets/images/protocol-icons/tokens/ETH.svg`}
          height={32}
          width={32}
          alt="ETH"
        />
        <Typography ml="0.5rem" variant="small">
          ETH
        </Typography>
      </Grid>,
      <Grid container alignItems="center" wrap="nowrap">
        <Image
          src={`/assets/images/protocol-icons/networks/Ethereum.svg`}
          height={24}
          width={24}
          alt="Ethereum"
        />
        <Typography ml="0.5rem" variant="small">
          Ethereum
        </Typography>
      </Grid>,
      1.8,
      2.25,
      ["AAVE", "COMP"],
      "A+",
      164800
    ),
    createData(
      <Grid container alignItems="center">
        <Image
          src={`/assets/images/protocol-icons/tokens/USDC.svg`}
          height={32}
          width={32}
          alt="USDC"
        />
        <Typography ml="0.5rem" variant="small">
          USDC
        </Typography>
      </Grid>,
      <Grid container alignItems="center">
        <Image
          src={`/assets/images/protocol-icons/tokens/ETH.svg`}
          height={32}
          width={32}
          alt="ETH"
        />
        <Typography ml="0.5rem" variant="small">
          ETH
        </Typography>
      </Grid>,
      <Grid container alignItems="center" wrap="nowrap">
        <Image
          src={`/assets/images/protocol-icons/networks/Ethereum.svg`}
          height={24}
          width={24}
          alt="Ethereum"
        />
        <Typography ml="0.5rem" variant="small">
          Ethereum
        </Typography>
      </Grid>,
      1.8,
      2.55,
      ["AAVE", "COMP"],
      "A+",
      164800,
      [
        createData(
          <></>,
          <></>,
          <Grid container alignItems="center" wrap="nowrap">
            <Image
              src={`/assets/images/protocol-icons/networks/Ethereum.svg`}
              height={24}
              width={24}
              alt="Ethereum"
            />
            <Typography ml="0.5rem" variant="small">
              Ethereum
            </Typography>
          </Grid>,
          1.8,
          2.55,
          ["AAVE", "COMP"],
          "A+",
          24800
        ),
        createData(
          <></>,
          <></>,
          <Grid container alignItems="center" wrap="nowrap">
            <Image
              src={`/assets/images/protocol-icons/networks/Polygon.svg`}
              height={24}
              width={24}
              alt="Polygon"
            />
            <Typography ml="0.5rem" variant="small">
              Polygon
            </Typography>
          </Grid>,
          1.5,
          2.75,
          ["AAVE", "COMP"],
          "A+",
          124800
        ),
        createData(
          <></>,
          <></>,
          <Grid container alignItems="center" wrap="nowrap">
            <Image
              src={`/assets/images/protocol-icons/networks/Fantom.svg`}
              height={24}
              width={24}
              alt="Fantom"
            />
            <Typography ml="0.5rem" variant="small">
              Fantom
            </Typography>
          </Grid>,
          1.5,
          2.95,
          ["AAVE", "COMP"],
          "A+",
          24800
        ),
        createData(
          <></>,
          <></>,
          <Grid container alignItems="center" wrap="nowrap">
            <Image
              src={`/assets/images/protocol-icons/networks/Optimism.svg`}
              height={24}
              width={24}
              alt="Optimism"
            />
            <Typography ml="0.5rem" variant="small">
              Optimism
            </Typography>
          </Grid>,
          1.3,
          2.98,
          ["AAVE", "COMP"],
          "A+",
          88000
        ),
        createData(
          <></>,
          <></>,
          <Grid container alignItems="center" wrap="nowrap">
            <Image
              src={`/assets/images/protocol-icons/networks/Arbitrum.svg`}
              height={24}
              width={24}
              alt="Arbitrum"
            />
            <Typography ml="0.5rem" variant="small">
              Arbitrum
            </Typography>
          </Grid>,
          1.3,
          2.99,
          ["AAVE", "COMP"],
          "A+",
          100000,
          [
            createData(
              <></>,
              <></>,
              <Grid container alignItems="center" wrap="nowrap">
                <Image
                  src={`/assets/images/protocol-icons/networks/Arbitrum.svg`}
                  height={24}
                  width={24}
                  alt="Arbitrum"
                />
                <Typography ml="0.5rem" variant="small">
                  Arbitrum
                </Typography>
              </Grid>,
              1.3,
              3.01,
              ["AAVE", "COMP"],
              "A+",
              100000
            ),
            createData(
              <></>,
              <></>,
              <Grid container alignItems="center" wrap="nowrap">
                <Image
                  src={`/assets/images/protocol-icons/networks/Arbitrum.svg`}
                  height={24}
                  width={24}
                  alt="Arbitrum"
                />
                <Typography ml="0.5rem" variant="small">
                  Arbitrum
                </Typography>
              </Grid>,
              1.3,
              3.02,
              ["WPC", "IB", "SONNE", "COMP", "COMP", "AAVE"],
              "B+",
              100000
            ),
          ]
        ),
      ]
    ),
    createData(
      <Grid container alignItems="center">
        <Image
          src={`/assets/images/protocol-icons/tokens/USDC.svg`}
          height={32}
          width={32}
          alt="USDC"
        />
        <Typography ml="0.5rem" variant="small">
          USDC
        </Typography>
      </Grid>,
      <Grid container alignItems="center">
        <Image
          src={`/assets/images/protocol-icons/tokens/ETH.svg`}
          height={32}
          width={32}
          alt="ETH"
        />
        <Typography ml="0.5rem" variant="small">
          ETH
        </Typography>
      </Grid>,
      <Grid container alignItems="center" wrap="nowrap">
        <Image
          src={`/assets/images/protocol-icons/networks/Ethereum.svg`}
          height={24}
          width={24}
          alt="Ethereum"
        />
        <Typography ml="0.5rem" variant="small">
          Ethereum
        </Typography>
      </Grid>,
      1.8,
      2.55,
      ["AAVE", "COMP"],
      "A+",
      24800
    ),
    createData(
      <Grid container alignItems="center">
        <Image
          src={`/assets/images/protocol-icons/tokens/USDT.svg`}
          height={32}
          width={32}
          alt="USDT"
        />
        <Typography ml="0.5rem" variant="small">
          USDT
        </Typography>
      </Grid>,
      <Grid container alignItems="center">
        <Image
          src={`/assets/images/protocol-icons/tokens/ETH.svg`}
          height={32}
          width={32}
          alt="ETH"
        />
        <Typography ml="0.5rem" variant="small">
          ETH
        </Typography>
      </Grid>,
      <Grid container alignItems="center" wrap="nowrap">
        <Image
          src={`/assets/images/protocol-icons/networks/Ethereum.svg`}
          height={24}
          width={24}
          alt="Ethereum"
        />
        <Typography ml="0.5rem" variant="small">
          Ethereum
        </Typography>
      </Grid>,
      1.8,
      2.65,
      ["WPC", "IB", "SONNE", "COMP", "COMP", "AAVE"],
      "B+",
      164800
    ),
  ]

  return (
    <TableContainer>
      <Table aria-label="Markets table">
        <TableHead>
          <TableRow sx={{ height: "2.625rem" }}>
            <TableCell align="center">Borrow</TableCell>
            <TableCell align="center">Collateral</TableCell>
            <TableCell align="center">Chain with the best rate</TableCell>
            <TableCell align="center">Supply APY</TableCell>
            <TableCell align="center">
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
            <TableCell align="center">
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
            <TableCell align="center">
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
            <TableCell align="center">Available Liquidity</TableCell>
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
