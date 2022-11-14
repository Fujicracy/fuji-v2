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
  Typography,
  useTheme,
} from "@mui/material"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import { Box } from "@mui/system"
import Image from "next/image"

import { DropletIcon } from "./DropletIcon"
import { Row } from "./MarketsTable"

type MarketsTableRowProps = {
  row: Row
  extra?: boolean
  isACollapsedRow?: boolean
}

export default function MarketsTableRow({
  row,
  extra,
  isACollapsedRow,
}: MarketsTableRowProps) {
  const { palette } = useTheme()
  const [expandRow, setExpandRow] = useState(false)

  return (
    <>
      <TableRow sx={{ height: "3.438rem" }}>
        <TableCell
          sx={{
            position: "sticky",
            left: 0,
            zIndex: 100,
            width: "11.25rem",
            background: isACollapsedRow
              ? row.collaspsedRows
                ? palette.secondary.main
                : ""
              : palette.secondary.contrastText,
          }}
        >
          {row.borrow && (
            <Stack direction="row" gap="0.5rem" alignItems="center">
              {row.collaspsedRows &&
                !isACollapsedRow &&
                (expandRow ? (
                  <KeyboardArrowDownIcon
                    onClick={() => setExpandRow(false)}
                    sx={{ cursor: "pointer" }}
                  />
                ) : (
                  <KeyboardArrowRightIcon
                    onClick={() => setExpandRow(true)}
                    sx={{ cursor: "pointer" }}
                  />
                ))}
              <Grid container alignItems="center" wrap="nowrap">
                <Image
                  src={`/assets/images/protocol-icons/tokens/${row.borrow}.svg`}
                  height={32}
                  width={32}
                  layout="fixed"
                  alt={row.borrow}
                />
                <Typography ml="0.5rem" variant="small">
                  {row.borrow}
                </Typography>
              </Grid>
            </Stack>
          )}
        </TableCell>
        <TableCell sx={{ width: "11rem" }}>
          {row.collateral && (
            <Grid container alignItems="center" wrap="nowrap">
              <Image
                src={`/assets/images/protocol-icons/tokens/${row.collateral}.svg`}
                height={32}
                width={32}
                layout="fixed"
                alt={row.collateral}
              />
              <Typography ml="0.5rem" variant="small">
                {row.collateral}
              </Typography>
            </Grid>
          )}
        </TableCell>
        <TableCell sx={{ width: "11rem" }}>
          <Stack direction="row" gap="0.5rem" alignItems="center">
            {row.collaspsedRows &&
              isACollapsedRow &&
              (expandRow ? (
                <KeyboardArrowDownIcon
                  onClick={() => setExpandRow(false)}
                  sx={{ cursor: "pointer" }}
                />
              ) : (
                <KeyboardArrowRightIcon
                  onClick={() => setExpandRow(true)}
                  sx={{ cursor: "pointer" }}
                />
              ))}

            <Grid
              container
              alignItems="center"
              wrap="nowrap"
              sx={{
                ml: !row.collaspsedRows && isACollapsedRow ? "2rem" : "",
              }}
            >
              <Image
                src={`/assets/images/protocol-icons/networks/${row.bestRateChain}.svg`}
                height={24}
                width={24}
                layout="fixed"
                alt={row.bestRateChain}
              />
              <Typography ml="0.5rem" variant="small">
                {row.bestRateChain}
              </Typography>
            </Grid>
          </Stack>
        </TableCell>
        <TableCell
          align="right"
          sx={{
            width: "8.75rem",
            color: palette.success.main,
          }}
        >
          {row.supplyAPI.toFixed(2)} %
        </TableCell>
        <TableCell
          align="right"
          sx={{
            width: "8.75rem",
            color: palette.warning.main,
          }}
        >
          <Grid
            container
            alignItems="center"
            justifyContent="center"
            wrap="nowrap"
          >
            {extra && <DropletIcon />}
            {row.borrowABR.toFixed(2)}%
          </Grid>
        </TableCell>
        <TableCell align="right" sx={{ width: "8.75rem" }}>
          <Grid container justifyContent="center" wrap="nowrap">
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
                    layout="fixed"
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
        <TableCell align="right" sx={{ width: "8.75rem" }}>
            <Chip variant={row.safetyRating === "A+" ? "success" : "warning"} label={row.safetyRating} />
        </TableCell>
        <TableCell align="right" sx={{ width: "8.75rem" }}>
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
            sx={{
              background:
                row.collaspsedRows && isACollapsedRow
                  ? palette.secondary.light
                  : palette.secondary.main,
            }}
          >
            <Table aria-label="purchases">
              <TableBody>
                {row.collaspsedRows?.map((collaspsedRow, i) => (
                  <MarketsTableRow
                    key={
                      i +
                      collaspsedRow.availableLiquidity /* TODO: Not sure for the key value */
                    }
                    row={collaspsedRow}
                    extra={false}
                    isACollapsedRow={true}
                  />
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}
