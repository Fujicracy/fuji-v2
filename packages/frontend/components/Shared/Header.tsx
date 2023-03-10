import { useState } from "react"
import { useTheme } from "@mui/material/styles"
import Link from "next/link"
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  MenuList,
  Grid,
  Fade,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Divider,
  ListItemText,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import Image from "next/image"
import { useRouter } from "next/router"
import { shallow } from "zustand/shallow"

import { BurgerMenuIcon } from "./Icons"
import ChainSelect from "./ChainSelect"
import Parameters from "./Parameters"
import styles from "../../styles/components/Header.module.css"
import { Balances } from "@web3-onboard/core/dist/types"
import AccountModal from "./AccountModal"
import { useHistory } from "../../store/history.store"
import Balance from "./Balance"
import ParameterLinks from "./ParameterLinks"
import { useAuth } from "../../store/auth.store"

const pages = [
  { name: "Markets", path: "/markets" },
  { name: "Borrow", path: "/borrow" },
  { name: "Lend", path: "/lend" },
  { name: "My positions", path: "/my-positions" },
]
if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
  pages.push({ name: "Theming", path: "theming" }) // TODO: "Theming" is to test the design system
}

const Header = () => {
  const { address, ens, status, balance, login } = useAuth(
    (state) => ({
      status: state.status,
      address: state.address,
      ens: state.ens,
      balance: state.balance,
      login: state.login,
    }),
    shallow
  )
  const { palette } = useTheme()
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null)
  const router = useRouter()
  const currentPage = `/${router.pathname.substring(1)}`

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElNav(event.currentTarget)

  const handleCloseNavMenu = () => setAnchorElNav(null)
  const isNavMenuOpen = Boolean(anchorElNav)

  const e2eConnect = () =>
    login({ autoSelect: { label: "MetaMask", disableModals: true } })

  const formattedAddress =
    address?.substring(0, 5) + "..." + address?.substring(address?.length - 4)

  return (
    <AppBar position="static">
      <Box
        p="0 1.25rem"
        sx={{
          background: palette.background.paper,
        }}
      >
        <Toolbar disableGutters>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Link href="/markets" legacyBehavior>
                <a className={styles.logoTitle}>
                  <Image
                    src="/assets/images/logo/logo-title.svg"
                    alt="Logo Fuji"
                    width={120}
                    height={50}
                    layout="fixed"
                  />
                </a>
              </Link>
            </Grid>
            <Grid item>
              <Box
                sx={{
                  flexGrow: 1,
                  display: { xs: "flex", md: "none" },
                  alignItems: "center",
                }}
              >
                {status === "disconnected" && (
                  <>
                    <Chip
                      label="Connect wallet"
                      variant="gradient"
                      sx={{ fontSize: "1rem" }}
                      onClick={() => login()}
                    />
                    <Button
                      data-cy="login"
                      onClick={e2eConnect}
                      sx={{ position: "absolute", visibility: "hidden" }}
                    >
                      e2e
                    </Button>
                  </>
                )}
                {status === "connected" && <ChainSelect />}

                <IconButton
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  color="inherit"
                  onClick={handleOpenNavMenu}
                >
                  {isNavMenuOpen ? (
                    <CloseIcon
                      sx={{
                        background: palette.secondary.dark,
                        borderRadius: "100%",
                        fontSize: "10.5px",
                        padding: "8px",
                        width: "34px",
                        height: "34px",
                      }}
                    />
                  ) : (
                    <BurgerMenuIcon />
                  )}
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorElNav}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                  keepMounted
                  open={Boolean(anchorElNav)}
                  onClose={handleCloseNavMenu}
                  sx={{ display: { xs: "block", lg: "none" } }}
                  TransitionComponent={Fade}
                >
                  <MenuList>
                    {pages.map((page) => (
                      <MenuItem key={page.path} onClick={handleCloseNavMenu}>
                        <ListItemText>
                          <Link href={page.path}>
                            <Typography variant="small">{page.name}</Typography>
                          </Link>
                        </ListItemText>
                      </MenuItem>
                    ))}
                    <MenuItem onClick={handleCloseNavMenu}>
                      <ListItemText>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="small">Wallet</Typography>
                          <Typography variant="small">
                            {formattedAddress}
                          </Typography>
                        </Stack>
                      </ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleCloseNavMenu}>
                      <ListItemText>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="small">
                            Transaction History
                          </Typography>
                        </Stack>
                      </ListItemText>
                    </MenuItem>
                    <Divider />
                    <ParameterLinks />
                  </MenuList>
                </Menu>
              </Box>
            </Grid>
          </Grid>

          <MenuList
            sx={{
              flexGrow: 1,
              display: { xs: "none", lg: "flex" },
              justifyContent: "center",
            }}
          >
            {pages.map((page) => (
              <Link key={page.path} href={page.path}>
                <MenuItem
                  sx={{
                    color: currentPage.includes(page.path.toLowerCase())
                      ? "primary.main"
                      : "text.primary",
                    textShadow: currentPage.includes(page.path.toLowerCase())
                      ? `${palette.primary.main} 0rem 0rem 0.125rem`
                      : "",
                    "&:hover": {
                      color: "primary.main",
                      background: "transparent",
                      textShadow: `${palette.primary.main} 0rem 0rem 0.125rem`,
                    },
                  }}
                >
                  {page.name}
                </MenuItem>
              </Link>
            ))}
          </MenuList>

          <Grid
            container
            columnGap="0.5rem"
            justifyContent="flex-end"
            alignItems="center"
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            {status === "disconnected" && (
              <>
                <Chip
                  label="Connect wallet"
                  variant="gradient"
                  sx={{ fontSize: "1rem" }}
                  onClick={() => login()}
                />
                <Button
                  data-cy="login"
                  onClick={e2eConnect}
                  sx={{ position: "absolute", visibility: "hidden" }}
                >
                  e2e
                </Button>
              </>
            )}
            {status === "connected" && (
              <>
                <Grid item>
                  <ChainSelect />
                </Grid>
                <Grid item>
                  <BalanceAddress
                    balance={balance}
                    address={address as string}
                    formattedAddress={formattedAddress as string}
                    ens={ens}
                  />
                </Grid>
                <Grid item>
                  <Parameters />
                </Grid>
              </>
            )}
          </Grid>
        </Toolbar>
      </Box>
    </AppBar>
  )
}
export default Header

type BalanceAddressProps = {
  address: string
  formattedAddress: string
  balance?: Balances
  ens?: string
}
const BalanceAddress = (props: BalanceAddressProps) => {
  const { palette } = useTheme()
  const active = useHistory((state) => state.ongoingTxns.length)

  const [accountModalEl, setAccountModalEl] = useState<
    HTMLElement | undefined
  >()
  const showAccountModal = Boolean(accountModalEl)
  const { balance, address, formattedAddress, ens } = props

  if (!balance) {
    return <></>
  }

  const [bal] = Object.values<string>(balance)
  const [token] = Object.keys(balance)

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
    <Box mr="-2rem">
      <Chip
        label={formattedBalance}
        sx={{ paddingRight: "2rem", fontSize: "0.875rem" }}
      />
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
