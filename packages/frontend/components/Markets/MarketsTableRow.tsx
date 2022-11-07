import { useState } from "react"
import {
  Chip,
  Collapse,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  useTheme,
} from "@mui/material"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import { Box } from "@mui/system"
import Image from "next/image"

import { DropletIcon } from "./DropletIcon"

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

type MarketsTableRowProps = {
  row: Row
  extra?: boolean
}

export default function MarketsTableRow({ row, extra }: MarketsTableRowProps) {
  const { palette } = useTheme()
  const [expandRow, setExpandRow] = useState(false)

  return (
    <>
      <TableRow>
        <TableCell sx={{ border: "1px solid white" }} align="center">
          <Stack direction="row" gap="0.5rem" alignItems="center">
            {expandRow ? (
              <KeyboardArrowDownIcon
                onClick={() => setExpandRow(false)}
                sx={{ cursor: "pointer" }}
              />
            ) : (
              <KeyboardArrowRightIcon
                onClick={() => setExpandRow(true)}
                sx={{ cursor: "pointer" }}
              />
            )}
            {row.borrow}
          </Stack>
        </TableCell>
        <TableCell sx={{ border: "1px solid white" }} align="center">
          {row.collateral}
        </TableCell>
        <TableCell sx={{ border: "1px solid white" }} align="center">
          {row.bestRateChain}
        </TableCell>
        <TableCell
          align="center"
          sx={{ color: palette.success.main, border: "1px solid white" }}
        >
          {row.supplyAPI.toFixed(2)} %
        </TableCell>
        <TableCell
          align="center"
          sx={{ color: palette.warning.main, border: "1px solid white" }}
        >
          <Grid container alignItems="center" justifyContent="center">
            {extra && <DropletIcon />}
            {row.borrowABR.toFixed(2)} %
          </Grid>
        </TableCell>
        <TableCell sx={{ border: "1px solid white" }} align="center">
          <Grid container justifyContent="center">
            {row.integratedProtocols.map((vault, i) => (
              <Box
                sx={{
                  position: "relative",
                  right: `${i * 0.25}rem`,
                  zIndex: 50 + -i,
                }}
                key={vault}
              >
                {i <= 2 && (
                  <Image
                    src={`/assets/images/protocol-icons/tokens/${vault}.svg`}
                    height={24}
                    width={24}
                    alt={vault}
                  />
                )}
              </Box>
            ))}
            {row.integratedProtocols.length >= 4 && (
              <Chip
                label={
                  <Grid container justifyContent="center">
                    +{row.integratedProtocols.length - 3}
                  </Grid>
                }
                variant="number"
              />
            )}
          </Grid>
        </TableCell>
        <TableCell sx={{ border: "1px solid white" }} align="center">
          {row.safetyRating === "A+" ? (
            <Chip variant="success" label={row.safetyRating} />
          ) : (
            <Chip variant="warning" label={row.safetyRating} />
          )}
        </TableCell>
        <TableCell sx={{ border: "1px solid white" }} align="center">
          $
          {row.availableLiquidity
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ padding: 0 }} colSpan={8}>
          <Collapse in={expandRow} timeout="auto" unmountOnExit>
            <Table size="small" aria-label="purchases">
              <TableBody>
                {row.collaspsedRows?.map((collaspsedRow, i) => (
                  <TableRow key={i + collaspsedRow.availableLiquidity}>
                    <TableCell sx={{ border: "1px solid white" }}></TableCell>
                    <TableCell sx={{ border: "1px solid white" }}></TableCell>
                    <TableCell sx={{ border: "1px solid white" }}></TableCell>
                    <TableCell sx={{ border: "1px solid white" }}></TableCell>

                    <TableCell
                      sx={{ border: "1px solid white" }}
                      align="center"
                    >
                      {collaspsedRow.bestRateChain}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: palette.success.main,
                        border: "1px solid white",
                      }}
                    >
                      {collaspsedRow.supplyAPI.toFixed(2)} %
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: palette.warning.main,
                        border: "1px solid white",
                      }}
                    >
                      <Grid
                        container
                        alignItems="center"
                        justifyContent="center"
                      >
                        {extra && <DropletIcon />}
                        {collaspsedRow.borrowABR.toFixed(2)} %
                      </Grid>
                    </TableCell>
                    <TableCell
                      sx={{ border: "1px solid white" }}
                      align="center"
                    >
                      <Grid container justifyContent="center">
                        {collaspsedRow.integratedProtocols.map((vault, i) => (
                          <Box
                            sx={{
                              position: "relative",
                              right: `${i * 0.25}rem`,
                              zIndex: 50 + -i,
                            }}
                            key={vault}
                          >
                            {i <= 2 && (
                              <Image
                                src={`/assets/images/protocol-icons/tokens/${vault}.svg`}
                                height={24}
                                width={24}
                                alt={vault}
                              />
                            )}
                          </Box>
                        ))}
                        {collaspsedRow.integratedProtocols.length >= 4 && (
                          <Chip
                            label={
                              <Grid container justifyContent="center">
                                +{collaspsedRow.integratedProtocols.length - 3}
                              </Grid>
                            }
                            variant="number"
                          />
                        )}
                      </Grid>
                    </TableCell>
                    <TableCell
                      sx={{ border: "1px solid white" }}
                      align="center"
                    >
                      {collaspsedRow.safetyRating === "A+" ? (
                        <Chip
                          variant="success"
                          label={collaspsedRow.safetyRating}
                        />
                      ) : (
                        <Chip
                          variant="warning"
                          label={collaspsedRow.safetyRating}
                        />
                      )}
                    </TableCell>
                    <TableCell
                      sx={{ border: "1px solid white" }}
                      align="center"
                    >
                      $
                      {collaspsedRow.availableLiquidity
                        .toString()
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}
