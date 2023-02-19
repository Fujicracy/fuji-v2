import { MouseEvent, useState } from "react"
import {
  Chip,
  Collapse,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import { Box } from "@mui/system"
import { useRouter } from "next/router"

import { sdk } from "../../services/sdk"
import { useBorrow } from "../../store/borrow.store"
import { useAuth } from "../../store/auth.store"

import { DropletIcon } from "./DropletIcon"
import { NetworkIcon, ProviderIcon, TokenIcon } from "../Shared/Icons"
import { SizableTableCell } from "../Shared/SizableTableCell"
import { BorrowingVault, Token, VaultWithFinancials } from "@x-fuji/sdk"
import { chainName } from "../../services/chains"
import { MarketRow, Status } from "../../helpers/markets"

type MarketsTableRowProps = {
  row: MarketRow
}

export default function MarketsTableRow({ row }: MarketsTableRowProps) {
  const { palette } = useTheme()
  const [expandRow, setExpandRow] = useState(false)

  const router = useRouter()

  const walletChain = useAuth((state) => state.chain)
  const changeAll = useBorrow((state) => state.changeAll)

  const handleExpand = (evt: MouseEvent) => {
    evt.stopPropagation()
    setExpandRow(!expandRow)
  }

  const handleClick = async (entity?: BorrowingVault | VaultWithFinancials) => {
    const vault = entity instanceof BorrowingVault ? entity : entity?.vault
    if (!vault) return

    const walletChainId = walletChain?.id as string
    const isSupported = chainName(walletChainId) !== ""

    // TODO: if user has a balance in vault, redirect to manage position

    if (isSupported) {
      const collaterals = sdk.getCollateralForChain(Number(walletChainId))
      const collateralToken = collaterals.find(
        (t: Token) => t.symbol === vault.collateral.symbol
      )
      changeAll(collateralToken ?? vault.collateral, vault.debt, vault)
    } else {
      changeAll(vault.collateral, vault.debt, vault)
    }

    router.push("/borrow")
  }

  const loaderOrError = (status: Status) =>
    status === Status.Loading ? (
      <Skeleton />
    ) : status === Status.Error ? (
      <Tooltip title="Error loading data" arrow>
        <ErrorOutlineIcon />
      </Tooltip>
    ) : (
      <></>
    )

  return (
    <>
      <TableRow
        onClick={() => handleClick(row.entity)}
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
          {loaderOrError(row.borrowApr.status)}
          {row.borrowApr.status === Status.Ready && (
            <Stack direction="row" alignItems="center" justifyContent="right">
              {row.borrowAprReward?.value > 0 && (
                <Tooltip
                  title={`${row.borrowAprBase.value.toFixed(
                    2
                  )}% (base) - ${row.borrowAprReward.value.toFixed(
                    2
                  )}% (reward)`}
                  arrow
                >
                  <IconButton>
                    <DropletIcon />
                  </IconButton>
                </Tooltip>
              )}
              {row.borrowApr.value.toFixed(2)} %
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell
          align="right"
          width="140px"
          sx={{ color: palette.success.main }}
        >
          {loaderOrError(row.depositApr.status)}
          {row.depositApr.status === Status.Ready && (
            <Stack direction="row" alignItems="center" justifyContent="right">
              {row.depositAprReward?.value > 0 && (
                <Tooltip
                  title={`${row.depositAprBase.value.toFixed(
                    2
                  )}% (base) + ${row.depositAprReward.value.toFixed(
                    2
                  )}% (reward)`}
                  arrow
                >
                  <IconButton>
                    <DropletIcon />
                  </IconButton>
                </Tooltip>
              )}
              {row.depositApr.value.toFixed(2)} %
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          {loaderOrError(row.integratedProtocols.status)}
          {row.integratedProtocols.status === Status.Ready && (
            <Stack
              direction="row"
              justifyContent="right"
              alignItems="center"
              flexWrap="nowrap"
            >
              {row.integratedProtocols.value.map((name, i) => (
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
                      <ProviderIcon
                        providerName={name}
                        height={24}
                        width={24}
                      />
                    )}
                  </Box>
                </Tooltip>
              ))}
              {row.integratedProtocols.value.length >= 4 && (
                <Chip
                  label={
                    <Stack direction="row" justifyContent="center">
                      +{row.integratedProtocols.value.length - 3}
                    </Stack>
                  }
                  variant="number"
                />
              )}
            </Stack>
          )}
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          <Chip
            variant={row.safetyRating.value === "A+" ? "success" : "warning"}
            label={row.safetyRating.value}
          />
        </SizableTableCell>
        <SizableTableCell align="right" width="140px">
          {loaderOrError(row.liquidity.status)}
          {row.liquidity.status === Status.Ready &&
            row.liquidity.value?.toLocaleString("en-US", {
              maximumSignificantDigits: 3,
              notation: "compact",
              style: "currency",
              currency: "usd",
            })}
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
                <TableBody>
                  <MarketsTableRow row={collaspsedRow} />
                </TableBody>
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
