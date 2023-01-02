import { MouseEvent, useState } from "react"
import {
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import { Box } from "@mui/system"
import { useRouter } from "next/router"

import { DropletIcon } from "./DropletIcon"
import { Row } from "./MarketsTable"
import NetworkIcon from "../NetworkIcon"
import TokenIcon from "../TokenIcon"
import { SizableTableCell } from "../SizableTableCell"
import ProviderIcon from "../ProviderIcon"
import { useStore } from "../../store"

type MarketsTableRowProps = {
  row: Row
  extra?: boolean
}

export default function MarketsTableRow({ row, extra }: MarketsTableRowProps) {
  const { palette } = useTheme()
  const [expandRow, setExpandRow] = useState(false)
  const handleExpand = (evt: MouseEvent) => {
    evt.stopPropagation()
    setExpandRow(!expandRow)
  }

  const router = useRouter()
  const change = useStore((s) => s.change)
  const handleClick = async (evt: MouseEvent) => {
    // TODO: Missing: should also select the vault
    change(
      { chain: row.chain, token: row.collateral },
      { chain: row.chain, token: row.borrow }
    )
    router.push("/borrow")
  }

  return (
    <>
      <TableRow
        onClick={handleClick}
        sx={{ height: "3.438rem", cursor: "pointer" }}
      >
        <SizableTableCell
          width="160px"
          sx={{
            position: "sticky",
            left: 0,
            zIndex: 5,
            background: row.isChild
              ? row.isGrandChild
                ? palette.secondary.light
                : palette.secondary.dark
              : palette.secondary.contrastText,
          }}
        >
          {row.borrow && (
            <Stack
              direction="row"
              gap={0.5}
              alignItems="center"
              sx={{ opacity: row.isChild ? 0 : 1 }}
            >
              <Toggle
                expandRow={expandRow}
                isVisible={Boolean(row.children && row.children.length > 0)}
                onClick={handleExpand}
              />
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
          <Stack direction="row" gap={0.5} alignItems="center">
            <Toggle
              expandRow={expandRow}
              isVisible={Boolean(row.isChild && row.children)}
              onClick={handleExpand}
            />
            <Stack direction="row" alignItems="center" flexWrap="nowrap">
              <NetworkIcon network={row.chain} width={24} height={24} />
              <Typography ml="0.5rem" variant="small">
                {row.chain}
              </Typography>
            </Stack>
          </Stack>
        </SizableTableCell>
        <SizableTableCell
          align="right"
          width="140px"
          sx={{ color: palette.success.main }}
        >
          <Stack direction="row" alignItems="center" justifyContent="right">
            {row.supplyApyReward > 0 && (
              <Tooltip
                title={`${row.supplyApyBase.toFixed(
                  2
                )}% (base) + ${row.supplyApyReward.toFixed(2)}% (reward)`}
                arrow
              >
                <IconButton>
                  <DropletIcon />
                </IconButton>
              </Tooltip>
            )}
            {row.supplyApy.toFixed(2)} %
          </Stack>
        </SizableTableCell>
        <SizableTableCell
          align="right"
          width="140px"
          sx={{ color: palette.warning.main }}
        >
          <Stack direction="row" alignItems="center" justifyContent="right">
            {row.borrowAprReward > 0 && (
              <Tooltip
                title={`${row.borrowAprBase.toFixed(
                  2
                )}% (base) - ${row.borrowAprReward.toFixed(2)}% (reward)`}
                arrow
              >
                <IconButton>
                  <DropletIcon />
                </IconButton>
              </Tooltip>
            )}
            {row.borrowApr.toFixed(2)}%
          </Stack>
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          <Stack direction="row" justifyContent="right" flexWrap="nowrap">
            {row.integratedProtocols.map((name, i) => (
              <Box
                sx={{
                  position: "relative",
                  right: `${i * 0.25}rem`,
                  zIndex: 4 - i,
                }}
                key={name}
              >
                {i <= 2 && (
                  <ProviderIcon providerName={name} height={24} width={24} />
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
                : palette.secondary.dark,
            }}
          >
            {row.children?.map((collaspsedRow, i) => (
              <Table key={i} sx={{ borderCollapse: "initial" }}>
                <MarketsTableRow row={collaspsedRow} extra={false} />
              </Table>
            ))}
          </Collapse>
        </SizableTableCell>
      </TableRow>
    </>
  )
}
type ToggleProps = {
  expandRow: boolean
  isVisible: boolean
  onClick: (e: MouseEvent) => void
}
function Toggle(props: ToggleProps) {
  const { expandRow, isVisible, onClick } = props

  const visibility = isVisible ? "visible" : "hidden"

  return (
    <IconButton onClick={onClick} size="small" sx={{ visibility }}>
      {expandRow ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
    </IconButton>
  )
}
