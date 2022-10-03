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
} from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import Image from "next/image"
import { useRouter } from "next/router"

import styles from "../styles/components/Header.module.css"
import ChainSelect from "./Form/ChainSelect"
import ParametersModal from "./ParametersModal"

const pages = ["Markets", "Borrow", "Lend", "My positions"]
if (process.env.NODE_ENV === "development") {
  pages.push("Theming") // TODO: "Theming" page is to test design system
}

const Header = () => {
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
                {pages.map(page => (
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

            <Grid container columnGap="0.5rem" justifyContent="flex-end">
              <Grid item>
                <ChainSelect />
              </Grid>
              <Grid item>
                <BalanceAddress />
              </Grid>
              <Grid item>
                <ParametersModal />
              </Grid>
            </Grid>
          </Toolbar>
        </Box>
      </AppBar>
    </>
  )
}

const BalanceAddress = () => {
  const theme = useTheme()
  const balance = 4.23
  const address = "0x6BV8...8974"

  return (
    <Box
      display="grid"
      gridTemplateColumns="1fr"
      sx={{
        ml: "5rem",
      }}
    >
      <Box
        gridColumn={1}
        gridRow={1}
        sx={{
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "4rem",
          height: "2.25rem",
          padding: "0.438rem 0.75rem",
          marginLeft: "-5rem",
        }}
      >
        <Typography align="center" variant="small">
          {balance} ETH
        </Typography>
      </Box>
      <Box
        gridColumn={1}
        gridRow={1}
        sx={{
          background: theme.palette.secondary.light,
          borderRadius: "4rem",
          height: "2.25rem",
          padding: "0.438rem 0.75rem",
        }}
      >
        <Typography align="center" variant="small">
          {address}
        </Typography>
      </Box>
    </Box>
  )
}

export default Header
