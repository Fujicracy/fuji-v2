import { useState } from "react"
import {
  Chip,
  Collapse,
  Stack,
  Table,
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
import NetworkIcon from "../NetworkIcon"
import TokenIcon from "../TokenIcon"
import { SizableTableCell } from "../SizableTableCell"

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
        <SizableTableCell
          width="160px"
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
            <Stack
              direction="row"
              gap="0.5rem"
              alignItems="center"
              sx={{ opacity: row.isChild ? 0 : 1 }}
            >
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
                <TokenIcon token={row.borrow} height={32} width={32} />
                <Typography ml="0.5rem" variant="small">
                  {row.borrow}
                </Typography>
              </Stack>
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell width="120px">
          {row.collateral && (
            <Stack
              direction="row"
              alignItems="center"
              flexWrap="nowrap"
              sx={{ opacity: row.isChild ? 0 : 1 }}
            >
              <TokenIcon token={row.collateral} height={32} width={32} />
              <Typography ml="0.5rem" variant="small">
                {row.collateral}
              </Typography>
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell width="200px">
          <Stack direction="row" gap="0.5rem" alignItems="start">
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
              <NetworkIcon network={row.bestRateChain} width={24} height={24} />
              <Typography ml="0.5rem" variant="small">
                {row.bestRateChain}
              </Typography>
            </Stack>
          </Stack>
        </SizableTableCell>
        <SizableTableCell
          align="right"
          width="140px"
          sx={{ color: palette.success.main }}
        >
          {row.supplyAPI.toFixed(2)} %
        </SizableTableCell>
        <SizableTableCell
          align="right"
          width="140px"
          sx={{ color: palette.warning.main }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="right"
            flexWrap="nowrap"
          >
            {extra && <DropletIcon />}
            {row.borrowAPR.toFixed(2)}%
          </Stack>
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          <Stack direction="row" justifyContent="right" flexWrap="nowrap">
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
                  // TODO use protocolIcon or providerIcon instead
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
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          <Chip
            variant={row.safetyRating === "A+" ? "success" : "warning"}
            label={row.safetyRating}
          />
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          $
          {row.availableLiquidity
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </SizableTableCell>
      </TableRow>

      <TableRow>
        <SizableTableCell
          sx={{ p: 0, borderBottom: "none !important" }}
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
              <Table key={i}>
                <MarketsTableRow row={collaspsedRow} extra={false} />
              </Table>
            ))}
          </Collapse>
        </SizableTableCell>
      </TableRow>
    </>
  )
}
