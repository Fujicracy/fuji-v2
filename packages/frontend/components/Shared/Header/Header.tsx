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
  Stack,
  Divider,
  ListItemText,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import { useRouter } from "next/router"
import { shallow } from "zustand/shallow"

import { BurgerMenuIcon } from "../Icons"
import ChainSelect from "../ChainSelect"
import Parameters from "../Parameters"
import styles from "../../../styles/components/Header.module.css"
import ParameterLinks from "../ParameterLinks"
import { useAuth } from "../../../store/auth.store"
import BalanceAddress from "./BalanceAddress"

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
  // window.alert(balance)
  return (
    <AppBar position="static">
      <Box
        p="0 1.25rem"
        sx={{
          background: palette.background.paper,
          ["@media screen and (max-width: 346px)"]: {
            p: "0 0.5rem",
          },
        }}
      >
        <Toolbar disableGutters>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Link href="/markets" legacyBehavior>
                <a className={styles.logoTitle}>
                  <Box
                    maxWidth={120}
                    maxHeight={50}
                    sx={{
                      maxWidth: "120px",
                      ["@media screen and (max-width: 346px)"]: {
                        maxWidth: "100px",
                      },
                    }}
                  >
                    <img
                      src="/assets/images/logo/logo-title.svg"
                      alt="Logo Fuji"
                      style={{ width: "100%", height: "auto" }}
                    />
                  </Box>
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
                      sx={{
                        fontSize: "1rem",
                        ["@media screen and (max-width: 346px)"]: {
                          fontSize: "0.6rem",
                        },
                      }}
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
                  sx={{ pr: "0" }}
                >
                  {isNavMenuOpen ? (
                    <CloseIcon
                      sx={{
                        background: palette.secondary.dark,
                        borderRadius: "100%",
                        fontSize: "12px",
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
                    {address && (
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
                    )}
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
                  sx={{
                    fontSize: "1rem",
                    ["@media screen and (max-width: 346px)"]: {
                      fontSize: "0.6rem",
                    },
                  }}
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
