import { useState } from "react"
import { useTheme } from "@mui/material/styles"
import { Box, Typography, Grid, Chip, CircularProgress } from "@mui/material"
import { Balances } from "@web3-onboard/core/dist/types"
import AccountModal from "../AccountModal"
import { useHistory } from "../../../store/history.store"
import Balance from "../Balance"

type BalanceAddressProps = {
  address: string
  formattedAddress: string
  balance?: Balances
  ens?: string
}
function BalanceAddress({
  address,
  formattedAddress,
  balance,
  ens,
}: BalanceAddressProps) {
  const { palette } = useTheme()
  const active = useHistory((state) => state.ongoingTxns.length)

  const [accountModalEl, setAccountModalEl] = useState<
    HTMLElement | undefined
  >()
  const showAccountModal = Boolean(accountModalEl)

  const [bal] = balance ? Object.values<string>(balance) : [""]
  const [token] = balance ? Object.keys(balance) : [""]

  const formattedBalance = <Balance balance={+bal} symbol={token} />
  const pending = active && (
    <Grid container alignItems="center">
      <CircularProgress size={16} sx={{ mr: "0.625rem" }} />
      <Typography
        variant="small"
        onClick={(e) => setAccountModalEl(e.currentTarget)}
      >
        {active} pending
      </Typography>
    </Grid>
  )

  return (
    <Box mr="-2rem" ml={balance ? "" : "2rem"}>
      {balance && (
        <Chip
          label={formattedBalance}
          sx={{ paddingRight: "2rem", fontSize: "0.875rem" }}
        />
      )}

      <Chip
        onClick={(e) => setAccountModalEl(e.currentTarget)}
        label={pending || ens || formattedAddress}
        sx={{
          background: palette.secondary.light,
          borderRadius: "4rem",
          height: "2.25rem",
          padding: "0.438rem 0.75rem",
          cursor: "pointer",
          fontSize: "0.875rem",
          position: "relative",
          left: "-2rem",
          backgroundColor: "#3C3D41", // Not part of the design system, one time use
          border: `1px solid ${palette.secondary.light}`,
          "&:hover": {
            backgroundColor: palette.secondary.main,
          },
        }}
      />
      <AccountModal
        isOpen={showAccountModal}
        anchorEl={accountModalEl as HTMLElement}
        closeAccountModal={() => setAccountModalEl(undefined)}
        address={address}
      />
    </Box>
  )
}

export default BalanceAddress
