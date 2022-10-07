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
  Button,
  Chip,
} from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import Image from "next/image"
import { useRouter } from "next/router"
import { Balances } from "@web3-onboard/core/dist/types"
import shallow from "zustand/shallow"

import styles from "../styles/components/Header.module.css"
import ChainSelect from "./Form/ChainSelect"
import ParametersModal from "./ParametersModal"
import { useStore } from "../store"

const pages = ["Markets", "Borrow", "Lend", "My positions"]
if (process.env.NODE_ENV === "development") {
  pages.push("Theming") // TODO: "Theming" page is to test design system
}

const Header = () => {
  const { address, status, balance, login } = useStore(
    (state) => ({
      status: state.status,
      address: state.address,
      balance: state.balance,
      login: state.login,
    }),
    shallow
  )
  const { palette } = useTheme()
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null)
  const router = useRouter()
  const currentPage = router.pathname.substring(1) // TODO: Maybe not the best way

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElNav(event.currentTarget)

  const handleCloseNavMenu = () => setAnchorElNav(null)

  return (
    <>
      <AppBar position="static">
        <Box
          sx={{
            background: palette.background.paper,
            padding: "0 2rem",
          }}
        >
          <Toolbar disableGutters>
            <Link href="/">
              <a className={styles.logoTitle}>
                <Image
                  src="/assets/images/logo/logo-title.svg"
                  alt="Logo Fuji"
                  width={120}
                  height={80}
                  layout="fixed"
                />
              </a>
            </Link>

            <Box
              sx={{
                flexGrow: 1,
                display: {
                  xs: "flex",
                  md: "none",
                },
              }}
            >
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                  display: {
                    xs: "block",
                    md: "none",
                  },
                }}
              >
                {pages.map((page) => (
                  <MenuItem key={page} onClick={handleCloseNavMenu}>
                    <Link href={`/${page.toLowerCase()}`}>
                      <Typography align="center">{page}</Typography>
                    </Link>
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            <MenuList
              sx={{
                flexGrow: 1,
                display: {
                  xs: "none",
                  md: "flex",
                },
                justifyContent: "center",
                ml: "12rem",
                mt: 1,
              }}
            >
              {pages.map((page: string) => (
                <MenuItem
                  key={page}
                  sx={{
                    color:
                      page.toLowerCase() === currentPage
                        ? "primary.main"
                        : "text.primary",
                    textShadow:
                      page.toLowerCase() === currentPage
                        ? `${palette.primary.main} 0rem 0rem 0.125rem`
                        : "",
                    "&:hover": {
                      color: "primary.main",
                      background: "transparent",
                      textShadow: `${palette.primary.main} 0rem 0rem 0.125rem`,
                    },
                  }}
                >
                  <Link href={`/${page.toLowerCase()}`}>{page}</Link>
                </MenuItem>
              ))}
            </MenuList>

            <Grid
              container
              columnGap="0.5rem"
              justifyContent="flex-end"
              alignItems="center"
            >
              {status === "disconnected" && (
                <Button variant="gradient" onClick={() => login()}>
                  Connect wallet
                </Button>
              )}
              {status === "connected" && (
                <>
                  <Grid item>
                    <ChainSelect />
                  </Grid>
                  <Grid item>
                    <BalanceAddress
                      // TODO: balance should be retrived from current chain, and not deduced
                      balance={balance}
                      address={address as string}
                    />
                  </Grid>
                  <Grid item>
                    <ParametersModal />
                  </Grid>
                </>
              )}
            </Grid>
          </Toolbar>
        </Box>
      </AppBar>
    </>
  )
}

type BalanceAddressProps = {
  balance: Balances
  address: string
}
const BalanceAddress = (props: BalanceAddressProps) => {
  const { palette } = useTheme()
  const { balance, address } = props
  if (!balance) {
    return <></>
  }

  const formattedAddress = `${address.substr(0, 5)}...${address.substr(-4, 4)}`
  const [bal] = Object.values<string>(balance)
  const [token] = Object.keys(balance)
  const formattedBalance = `${bal.substring(0, 6)} ${token}`

  return (
    <Box mr="-2rem">
      <Chip
        label={formattedBalance}
        sx={{ paddingRight: "2rem", fontSize: ".9rem", lineHeight: ".9rem" }}
      />
      <Chip
        label={formattedAddress}
        sx={{
          fontSize: ".9rem",
          lineHeight: ".9rem",
          position: "relative",
          left: "-2rem",
          backgroundColor: palette.secondary.light,
        }}
      />
    </Box>
  )
}

export default Header
