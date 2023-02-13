import { MouseEvent, useState } from "react"
import {
  Chip,
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

import { sdk } from "../../services/sdk"
import { useBorrow } from "../../store/borrow.store"
import { useAuth } from "../../store/auth.store"

import { DropletIcon } from "./DropletIcon"
import { Row } from "./MarketsTable"
import { NetworkIcon, ProviderIcon, TokenIcon } from "../Shared/Icons"
import { SizableTableCell } from "../Shared/SizableTableCell"
import { BorrowingVault, Token } from "@x-fuji/sdk"
import { chainName } from "../../services/chains"

type MarketsTableRowProps = {
  row: Row
}

export default function MarketsTableRow({ row }: MarketsTableRowProps) {
  const { palette } = useTheme()
  const [expandRow, setExpandRow] = useState(false)

  const router = useRouter()

  const walletChain = useAuth((state) => state.chain)
  const changeCollateralChain = useBorrow(
    (state) => state.changeCollateralChain
  )

  const changeBorrowChain = useBorrow((state) => state.changeBorrowChain)
  const changeVault = useBorrow((state) => state.changeActiveVault)

  const handleExpand = (evt: MouseEvent) => {
    evt.stopPropagation()
    setExpandRow(!expandRow)
  }

  const handleClick = async (vault: BorrowingVault) => {
    const vaultChainId = `0x${vault.chainId.toString(16)}`
    const walletChainId = walletChain?.id as string
    const isSupported = chainName(walletChainId) !== ""

    if (isSupported) {
      const collaterals = sdk.getCollateralForChain(Number(walletChainId))
      const collateralToken = collaterals.find(
        (t: Token) => t.symbol === vault.collateral.symbol
      )

      changeCollateralChain(walletChainId, collateralToken)
    }

    changeBorrowChain(vaultChainId, vault.debt)
    changeVault(vault)

    router.push("/borrow")
  }

  const displayLiquidity = (liquidity: number | "loading" | "error") => {
    if (liquidity === "loading") {
      return "loading..."
    } else if (liquidity === "error") {
      return "error loading"
    }

    return liquidity.toLocaleString("en-US", {
      maximumSignificantDigits: 3,
      notation: "compact",
      style: "currency",
      currency: "usd",
    })
  }

  return (
    <>
      <TableRow
        onClick={() => handleClick(row.vault)}
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
          sx={{ color: palette.warning.main }}
        >
          <Stack direction="row" alignItems="center" justifyContent="right">
            {row.borrowApyReward > 0 && (
              <Tooltip
                title={`${row.borrowApyBase.toFixed(
                  2
                )}% (base) - ${row.borrowApyReward.toFixed(2)}% (reward)`}
                arrow
              >
                <IconButton>
                  <DropletIcon />
                </IconButton>
              </Tooltip>
            )}
            {row.borrowApy.toFixed(2)}%
          </Stack>
        </SizableTableCell>
        <SizableTableCell
          align="right"
          width="140px"
          sx={{ color: palette.success.main }}
        >
          <Stack direction="row" alignItems="center" justifyContent="right">
            {row.depositApyReward > 0 && (
              <Tooltip
                title={`${row.depositApyBase.toFixed(
                  2
                )}% (base) + ${row.depositApyReward.toFixed(2)}% (reward)`}
                arrow
              >
                <IconButton>
                  <DropletIcon />
                </IconButton>
              </Tooltip>
            )}
            {row.depositApy.toFixed(2)} %
          </Stack>
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          <Stack
            direction="row"
            justifyContent="right"
            alignItems="center"
            flexWrap="nowrap"
          >
            {row.integratedProtocols.map((name, i) => (
              <Tooltip key={name} title={name} arrow>
                <Box
                  sx={{
                    position: "relative",
                    right: `${i * 0.25}rem`,
                    zIndex: 4 - i,
                    height: "24px",
                  }}
                >
                  {i <= 2 && (
                    <ProviderIcon providerName={name} height={24} width={24} />
                  )}
                </Box>
              </Tooltip>
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
          {displayLiquidity(row.liquidity)}
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
                <MarketsTableRow row={collaspsedRow} />
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
