import { useState } from "react"
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
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import Image from "next/image"
import MarketsTableRow from "./MarketsTableRow"

export default function MarketsTable() {
  const { palette } = useTheme()
  const [expandRow, setExpandRow] = useState(false)

  function createData(
    borrow: React.ReactNode,
    collateral: React.ReactNode,
    bestRateChain: React.ReactNode,
    supplyAPI: number,
    borrowABR: number,
    integratedProtocols: string[],
    safetyRating: string,
    availableLiquidity: number
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
    }
  }

  const rows = [
    createData(
      <Grid container alignItems="center">
        {expandRow ? (
          <KeyboardArrowDownIcon
            onClick={() => setExpandRow(false)}
            sx={{ mr: "0.5rem", cursor: "pointer" }}
          />
        ) : (
          <KeyboardArrowRightIcon
            onClick={() => setExpandRow(true)}
            sx={{ mr: "0.5rem", cursor: "pointer" }}
          />
        )}
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
      <Grid container alignItems="center">
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
      ["AAVE", "COMP", "AAVE", "COMP"],
      "A+",
      164800
    ),
  ]

  return (
    <TableContainer>
      <Table aria-label="Markets table">
        <TableHead>
          <TableRow>
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
          {/* Not sure for the key value */}
          {rows.map((row, i) => (
            <MarketsTableRow
              key={i + row.availableLiquidity}
              row={row}
              setExpandRow={() => setExpandRow(!expandRow)}
              expandRow={expandRow}
              extra={i === 0}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
