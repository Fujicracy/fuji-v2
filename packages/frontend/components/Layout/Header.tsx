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
  Snackbar,
  Button,
  Chip,
  SnackbarContent,
  CircularProgress,
} from "@mui/material"
import Image from "next/image"
import { useRouter } from "next/router"
import shallow from "zustand/shallow"

import { BurgerMenuIcon } from "./BurgerMenuIcon"
import CloseIcon from "@mui/icons-material/Close"
import SyncIcon from "@mui/icons-material/Sync"
import ChainSelect from "../Form/ChainSelect"
import Parameters from "./Parameters"
import styles from "../../styles/components/Header.module.css"
import { useStore } from "../../store"
import { Balances } from "@web3-onboard/core/dist/types"
import { useTransactionStore } from "../../store/useTransactionStore"
import AccountModal from "./AccountModal"

const pages = ["Markets", "Borrow", "Lend", "My positions"]
if (process.env.NODE_ENV === "development") {
  pages.push("Theming") // TODO: "Theming" page is to test design system
}

const Header = () => {
  const { address, ens, status, balance, login } = useStore(
    (state) => ({
      status: state.status,
      address: state.address,
      ens: state.ens,
      balance: state.balance,
      login: state.login,
    }),
    shallow
  )
  const { transactionStatus } = useTransactionStore((state) => ({
    transactionStatus: state.transactionStatus,
  }))
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
                  <ChainSelect />

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
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                    keepMounted
                    open={Boolean(anchorElNav)}
                    onClose={handleCloseNavMenu}
                    sx={{ display: { xs: "block", lg: "none" } }}
                    TransitionComponent={Fade}
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
                display: { xs: "none", lg: "flex" },
                justifyContent: "center",
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
              sx={{ display: { xs: "none", md: "flex" }, mt: "1rem" }}
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
                      ens={ens}
                      transactionStatus={transactionStatus}
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
    </>
  )
}

type BalanceAddressProps = {
  balance?: Balances
  address: string
  ens: string | null
  transactionStatus: boolean
}
const BalanceAddress = (props: BalanceAddressProps) => {
  const { palette } = useTheme()
  const [showAccountModal, setShowAccountModal] = useState(false)
  const { balance, address, ens } = props

  const { showTransactionAbstract, setShowTransactionAbstract } =
    useTransactionStore((state) => ({
      showTransactionAbstract: state.showTransactionAbstract,
      setShowTransactionAbstract: state.setShowTransactionAbstract,
    }))

  const closeTransactionProcessing = () => setShowTransactionAbstract(false)

  if (!balance) {
    return <></>
  }

  const formattedAddress = `${address.substring(0, 5)}...${address.substring(
    -4,
    4
  )}`
  const [bal] = Object.values<string>(balance)
  const [token] = Object.keys(balance)
  const formattedBalance =
    token === "ETH"
      ? `${bal.substring(0, 5)} ${token}`
      : `${bal.substring(0, 4)} ${token}`

  return (
    <Box mr="-2rem">
      <Chip
        label={formattedBalance}
        sx={{ paddingRight: "2rem", fontSize: ".9rem", lineHeight: ".9rem" }}
      />
      <Chip
        onClick={() => setShowAccountModal(true)}
        label={
          props.transactionStatus ? (
            <Grid container alignItems="center">
              <CircularProgress size={16} sx={{ mr: "0.625rem" }} />
              <Typography
                variant="small"
                onClick={() => setShowAccountModal(true)}
              >
                1 pending
              </Typography>
            </Grid>
          ) : (
            ens || formattedAddress
          )
        }
        sx={{
          background: palette.secondary.light,
          borderRadius: "4rem",
          height: "2.25rem",
          padding: "0.438rem 0.75rem",
          cursor: "pointer",
          fontSize: ".9rem",
          lineHeight: ".9rem",
          position: "relative",
          left: "-2rem",
          ":hover": {
            background: palette.secondary.main,
          },
        }}
      />
      {props.transactionStatus && showTransactionAbstract && (
        <Snackbar
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{ mr: "2rem" }}
          open={showTransactionAbstract}
          onClose={closeTransactionProcessing}
        >
          <SnackbarContent
            sx={{
              background: "transparent",
              boxShadow: "none",
              mt: "1.5rem",
            }}
            message={
              <Box
                sx={{
                  background: palette.secondary.contrastText,
                  border: `1px solid ${palette.secondary.light}`,
                  borderRadius: "1.125rem",
                  p: "1rem",
                  color: palette.text.primary,
                }}
              >
                <CloseIcon
                  sx={{
                    cursor: "pointer",
                    position: "absolute",
                    right: "2rem",
                  }}
                  onClick={closeTransactionProcessing}
                  fontSize="small"
                />
                <Grid container>
                  <Grid item>
                    <SyncIcon sx={{ mr: "0.563rem" }} />
                  </Grid>
                  <Grid item>
                    <Box
                      sx={{
                        maxWidth: "14.25rem",
                        mr: "3rem",
                      }}
                    >
                      <Typography variant="small">
                        Deposit 1.00 ETH on Ethereum and Borrow 675 USDC on
                        Polygon
                      </Typography>
                      <br />

                      <Typography variant="xsmallDark">
                        Estimated time:{" "}
                        <span style={{ color: palette.success.main }}>
                          2m 15s
                        </span>
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
                  </Grid>
                </Grid>
              </Box>
            }
          />
        </Snackbar>
      )}
      <AccountModal
        isOpen={showAccountModal}
        closeAccountModal={() => setShowAccountModal(false)}
        address={formattedAddress}
      />
    </Box>
  )
}

export default Header
