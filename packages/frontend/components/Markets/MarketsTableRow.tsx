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
  const [expandChainRow, setExpandChainRow] = useState(false)

  return (
    <>
      <TableRow sx={{ height: "3.438rem" }}>
        <TableCell sx={{ width: "15.4%" }}>
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
        <TableCell sx={{ width: "15.4%" }}>{row.collateral}</TableCell>
        <TableCell sx={{ width: "15.4%" }}>{row.bestRateChain}</TableCell>
        <TableCell
          align="right"
          sx={{
            color: palette.success.main,
          }}
        >
          {row.supplyAPI.toFixed(2)} %
        </TableCell>
        <TableCell
          align="right"
          sx={{
            color: palette.warning.main,
          }}
        >
          <Grid container alignItems="center" justifyContent="center">
            {extra && <DropletIcon />}
            {row.borrowABR.toFixed(2)} %
          </Grid>
        </TableCell>
        <TableCell align="right">
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
        <TableCell align="right">
          {row.safetyRating === "A+" ? (
            <Chip variant="success" label={row.safetyRating} />
          ) : (
            <Chip variant="warning" label={row.safetyRating} />
          )}
        </TableCell>
        <TableCell align="right">
          $
          {row.availableLiquidity
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell sx={{ p: 0 }} colSpan={8}>
          <Collapse
            in={expandRow}
            timeout="auto"
            unmountOnExit
            sx={{ background: palette.secondary.main }}
          >
            <Table aria-label="purchases">
              <TableBody>
                {row.collaspsedRows?.map((collaspsedRow, i) => (
                  <>
                    <TableRow
                      sx={{ height: expandRow ? "3.438rem" : "" }}
                      key={i + collaspsedRow.availableLiquidity}
                    >
                      <TableCell sx={{ width: "15.4%" }}></TableCell>
                      <TableCell sx={{ width: "15.4%" }}></TableCell>
                      <TableCell sx={{ width: "15.4%" }} align="center">
                        <Stack direction="row" gap="0.5rem" alignItems="center">
                          {expandChainRow ? (
                            <KeyboardArrowDownIcon
                              onClick={() => setExpandChainRow(false)}
                              sx={{ cursor: "pointer" }}
                            />
                          ) : (
                            <KeyboardArrowRightIcon
                              onClick={() => setExpandChainRow(true)}
                              sx={{ cursor: "pointer" }}
                            />
                          )}
                          {collaspsedRow.bestRateChain}
                        </Stack>
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: palette.success.main,
                        }}
                      >
                        {collaspsedRow.supplyAPI.toFixed(2)} %
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: palette.warning.main,
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
                      <TableCell align="right">
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
                                  +
                                  {collaspsedRow.integratedProtocols.length - 3}
                                </Grid>
                              }
                              variant="number"
                            />
                          )}
                        </Grid>
                      </TableCell>
                      <TableCell align="right">
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
                      <TableCell align="right">
                        $
                        {collaspsedRow.availableLiquidity
                          .toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell sx={{ p: 0 }} colSpan={8}>
                        <Collapse
                          in={expandChainRow}
                          timeout="auto"
                          unmountOnExit
                          sx={{ background: palette.secondary.light }}
                        >
                          <Table aria-label="purchases">
                            <TableBody>
                              {collaspsedRow.collaspsedRows?.map(
                                (collaspsedChainRow, i) => (
                                  <TableRow
                                    sx={{
                                      height: expandChainRow ? "3.438rem" : "",
                                    }}
                                    key={
                                      i + collaspsedChainRow.availableLiquidity
                                    }
                                  >
                                    <TableCell
                                      sx={{ width: "15.4%" }}
                                    ></TableCell>
                                    <TableCell
                                      sx={{ width: "15.4%" }}
                                    ></TableCell>
                                    <TableCell
                                      sx={{
                                        width: "15.4%",
                                      }}
                                    >
                                      {collaspsedChainRow.bestRateChain}
                                    </TableCell>
                                    <TableCell
                                      align="right"
                                      sx={{
                                        color: palette.success.main,
                                      }}
                                    >
                                      {collaspsedChainRow.supplyAPI.toFixed(2)}{" "}
                                      %
                                    </TableCell>
                                    <TableCell
                                      align="right"
                                      sx={{
                                        color: palette.warning.main,
                                      }}
                                    >
                                      <Grid
                                        container
                                        alignItems="center"
                                        justifyContent="center"
                                      >
                                        {extra && <DropletIcon />}
                                        {collaspsedChainRow.borrowABR.toFixed(
                                          2
                                        )}{" "}
                                        %
                                      </Grid>
                                    </TableCell>
                                    <TableCell sx={{}} align="right">
                                      <Grid container justifyContent="center">
                                        {collaspsedChainRow.integratedProtocols.map(
                                          (vault, i) => (
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
                                          )
                                        )}
                                        {collaspsedChainRow.integratedProtocols
                                          .length >= 4 && (
                                          <Chip
                                            label={
                                              <Grid
                                                container
                                                justifyContent="center"
                                              >
                                                +
                                                {collaspsedChainRow
                                                  .integratedProtocols.length -
                                                  3}
                                              </Grid>
                                            }
                                            variant="number"
                                          />
                                        )}
                                      </Grid>
                                    </TableCell>
                                    <TableCell sx={{}} align="right">
                                      {collaspsedChainRow.safetyRating ===
                                      "A+" ? (
                                        <Chip
                                          variant="success"
                                          label={
                                            collaspsedChainRow.safetyRating
                                          }
                                        />
                                      ) : (
                                        <Chip
                                          variant="warning"
                                          label={
                                            collaspsedChainRow.safetyRating
                                          }
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell sx={{}} align="right">
                                      $
                                      {collaspsedChainRow.availableLiquidity
                                        .toString()
                                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}
