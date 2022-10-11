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
  LinearProgress,
  Fade,
} from "@mui/material"
import Image from "next/image"
import { useRouter } from "next/router"

import styles from "../../styles/components/Header.module.css"
import { BurgerMenuIcon } from "./BurgerMenuIcon"
import CloseIcon from "@mui/icons-material/Close"
import ChainSelect from "../Form/ChainSelect"
import Parameters from "./Parameters"

import { chains } from "../../machines/auth.machine"

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
            padding: "0 1.25rem",
          }}
        >
          <Toolbar disableGutters>
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid item>
                <Link href="/">
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
                  <ChainSelect selectedChain={chains[0]} />

                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    color="inherit"
                    onClick={handleOpenNavMenu}
                    sx={{ pr: 0 }}
                  >
                    <BurgerMenuIcon />
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
                      display: { xs: "block", md: "none" },
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
              </Grid>
            </Grid>

            <MenuList
              sx={{
                flexGrow: 1,
                display: { xs: "none", md: "flex" },
                justifyContent: "center",
                ml: "1rem",
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
              sx={{ display: { xs: "none", sm: "flex" }, mt: "1rem" }}
            >
              <Grid item>
                <ChainSelect selectedChain={chains[0]} />
              </Grid>
              <Grid item>
                <BalanceAddress />
              </Grid>
              <Grid item>
                <Parameters />
              </Grid>
            </Grid>
          </Toolbar>
        </Box>
      </AppBar>
    </>
  )
}

const BalanceAddress = () => {
  const { palette } = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)

  const openTransactionProcessing = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => setAnchorEl(event.currentTarget)

  const closeTransactionProcessing = () => setAnchorEl(null)

  const balance = 4.23
  const address = "0x6BV8...8974"

  return (
    <Box display="grid" gridTemplateColumns="1fr" sx={{ ml: "5rem" }}>
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
          background: palette.secondary.light,
          borderRadius: "4rem",
          height: "2.25rem",
          padding: "0.438rem 0.75rem",
          cursor: "pointer",
          ":hover": {
            background: palette.secondary.main,
          },
        }}
      >
        <Typography
          align="center"
          onClick={openTransactionProcessing}
          variant="small"
        >
          {address}
        </Typography>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={closeTransactionProcessing}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        sx={{
          ".MuiPaper-root": {
            background: "transparent",
          },
          mt: "1.25rem",
        }}
        TransitionComponent={Fade}
      >
        <Box
          sx={{
            background: palette.secondary.contrastText,
            border: `1px solid ${palette.secondary.light}`,
            borderRadius: "1.125rem",
            padding: "1rem",
            color: palette.text.primary,
          }}
        >
          <CloseIcon
            sx={{
              cursor: "pointer",
              float: "right",
            }}
            onClick={closeTransactionProcessing}
            fontSize="small"
          />
          <Box sx={{ maxWidth: "14.25rem", mr: "3rem" }}>
            <Typography variant="small">
              Deposit 1.00 ETH on Ethereum and Borrow 675 USDC on Polygon
            </Typography>
            <br />

            <Typography variant="xsmallDark">
              Estimated time:{" "}
              <span style={{ color: palette.success.main }}>2m 15s</span>
            </Typography>
            <LinearProgress
              sx={{
                background: palette.text.primary,
                height: "0.125rem",
                mt: "1rem",
                ".css-uu0lzf-MuiLinearProgress-bar1": {
                  background: palette.success.main,
                },
              }}
              value={25}
              variant="determinate"
            />
          </Box>
        </Box>
      </Menu>
    </Box>
  )
}

export default Header
