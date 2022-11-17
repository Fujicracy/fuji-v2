import { useState } from "react"
import {
  Chip,
  Collapse,
  Stack,
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
}

export default function MarketsTableRow({ row, extra }: MarketsTableRowProps) {
  const { palette } = useTheme()
  const [expandRow, setExpandRow] = useState(false)

  return (
    <>
      <TableRow sx={{ height: "3.438rem" }}>
        <TableCell
          sx={{
            position: "sticky",
            left: 0,
            zIndex: 1,
            background: row.isChild
              ? row.children && palette.secondary.main
              : palette.secondary.contrastText,
          }}
        >
          {row.borrow && (
            <Stack direction="row" gap="0.5rem" alignItems="center">
              {expandRow ? (
                <KeyboardArrowDownIcon
                  onClick={() => setExpandRow(false)}
                  sx={{
                    cursor: "pointer",
                    visibility:
                      row.children && row.children.length > 0
                        ? "visible"
                        : "hidden",
                  }}
                />
              ) : (
                <KeyboardArrowRightIcon
                  onClick={() => setExpandRow(true)}
                  sx={{
                    cursor: "pointer",
                    visibility:
                      row.children && row.children.length > 0
                        ? "visible"
                        : "hidden",
                  }}
                />
              )}
              <Stack direction="row" alignItems="center" flexWrap="nowrap">
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
              </Stack>
            </Stack>
          )}
        </TableCell>
        <TableCell>
          {row.collateral && (
            <Stack direction="row" alignItems="center" flexWrap="nowrap">
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
            </Stack>
          )}
        </TableCell>
        <TableCell>
          <Stack direction="row" gap="0.5rem" alignItems="center">
            {expandRow ? (
              <KeyboardArrowDownIcon
                onClick={() => setExpandRow(false)}
                sx={{
                  cursor: "pointer",
                  visibility:
                    row.isChild && row.children ? "visible" : "hidden",
                }}
              />
            ) : (
              <KeyboardArrowRightIcon
                onClick={() => setExpandRow(true)}
                sx={{
                  cursor: "pointer",
                  visibility:
                    row.isChild && row.children ? "visible" : "hidden",
                }}
              />
            )}
            <Stack direction="row" alignItems="center" flexWrap="nowrap">
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
            </Stack>
          </Stack>
        </TableCell>
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
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            flexWrap="nowrap"
          >
            {extra && <DropletIcon />}
            {row.borrowABR.toFixed(2)}%
          </Stack>
        </TableCell>
        <TableCell align="right">
          <Stack direction="row" justifyContent="center" flexWrap="nowrap">
            {row.integratedProtocols.map((vault, i) => (
              <Box
                sx={{
                  position: "relative",
                  right: `${i * 0.25}rem`,
                  zIndex: row.integratedProtocols.length - i,
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
                  <Stack direction="row" justifyContent="center">
                    +{row.integratedProtocols.length - 3}
                  </Stack>
                }
                variant="number"
              />
            )}
          </Stack>
        </TableCell>
        <TableCell align="right">
          <Chip
            variant={row.safetyRating === "A+" ? "success" : "warning"}
            label={row.safetyRating}
          />
        </TableCell>
        <TableCell align="right">
          $
          {row.availableLiquidity
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell
          sx={{
            p: 0,
            borderBottom: "none !important",
          }}
          colSpan={8}
        >
          <Collapse
            in={expandRow}
            timeout="auto"
            unmountOnExit
            sx={{
              background: row.isChild
                ? palette.secondary.light
                : palette.secondary.main,
            }}
          >
            {row.children?.map((collaspsedRow, i) => (
              <MarketsTableRow key={i} row={collaspsedRow} extra={false} />
            ))}
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}
