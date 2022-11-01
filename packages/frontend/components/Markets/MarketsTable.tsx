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

export default function MarketsTable() {
  const { palette } = useTheme()

  function createData(
    borrow: string,
    collateral: string,
    bestRateChain: string,
    supplyAPI: number,
    borrowABR: number,
    availableVault: string[],
    safetyRating: string,
    availableLiquidity: number
  ) {
    return {
      borrow,
      collateral,
      bestRateChain,
      supplyAPI,
      borrowABR,
      availableVault,
      safetyRating,
      availableLiquidity,
    }
  }

  const rows = [
    createData(
      "DAI",
      "ETH",
      "Ethereum",
      1.8,
      2.25,
      ["AAVE", "TMP"],
      "A+",
      164.8
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
                  title="???" // TODO: Ask value to Ivan
                  placement="top"
                >
                  <InfoOutlinedIcon
                    sx={{
                      fontSize: "0.875rem",
                      color: palette.info.main,
                    }}
                  />
                </Tooltip>
                <span>Available Vault</span>
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
                  title="???" // TODO: Ask value to Ivan
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
          {rows.map((row) => (
            <TableRow key={row.borrow + row.availableLiquidity}>
              <TableCell align="center">{row.borrow}</TableCell>
              <TableCell align="center">{row.collateral}</TableCell>
              <TableCell align="center">{row.bestRateChain}</TableCell>
              <TableCell align="center">{row.supplyAPI}</TableCell>
              <TableCell align="center">{row.borrowABR}</TableCell>
              <TableCell align="center">{row.availableVault}</TableCell>
              <TableCell align="center">{row.safetyRating}</TableCell>
              <TableCell align="center">{row.availableLiquidity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
