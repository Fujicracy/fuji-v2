import { useState } from 'react'

import Link from 'next/link'
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Button
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import AdbIcon from '@mui/icons-material/Adb'
import Image from 'next/image'
import { useRouter } from 'next/router'

import styles from '../styles/components/Header.module.css'
import Authentication from './Authentication'

const pages = ['Markets', 'Borrow', 'Lend', 'My positions', 'Theming'] // TODO: "Theming" page is for tests
// const settings = ["Profile", "Account", "Dashboard", "Logout"]

const Header = () => {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null)
  // const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null)
  const router = useRouter()
  const currentPage = router.pathname.substring(1) // TODO: Maybe not the best way

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElNav(event.currentTarget)
  // const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) =>
  //   setAnchorElUser(event.currentTarget)

  const handleCloseNavMenu = () => setAnchorElNav(null)
  // const handleCloseUserMenu = () => setAnchorElUser(null)

  return (
    <>
      <AppBar position='static'>
        <Container maxWidth='xl' sx={{ background: 'black' }}>
          <Toolbar disableGutters>
            <Link href='/'>
              <a className={styles.logoTitle}>
                {/*<>
                <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
                 <Typography
                  variant='h6'
                  noWrap
                  component='a'
                  href='/'
                  sx={{
                    mr: 2,
                    display: { xs: 'none', md: 'flex' },
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '.3rem',
                    color: 'inherit',
                    textDecoration: 'none'
                  }}
                >
                  Fuji v2
                  {/* TODO: Logo 
                </Typography> */}
                <Image
                  src='/assets/images/logo/logo-title.svg'
                  alt='Logo Fuji'
                  width={120}
                  height={80}
                  layout="fixed"
                />
              </a>
              {/* </> */}
            </Link>

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size='large'
                aria-label='account of current user'
                aria-controls='menu-appbar'
                aria-haspopup='true'
                onClick={handleOpenNavMenu}
                color='inherit'
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id='menu-appbar'
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left'
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                  display: { xs: 'block', md: 'none' }
                }}
              >
                {pages.map(page => (
                  <MenuItem key={page} onClick={handleCloseNavMenu}>
                    <Link href={`/${page.toLowerCase()}`}>
                      <Typography textAlign='center'>{page}</Typography>
                    </Link>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            {/* <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
            <Typography
              variant='h5'
              noWrap
              component='a'
              href=''
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none'
              }}
            >
              Fuji v2
            </Typography> */}

            {/* MENU */}
            <Box
              sx={{
                flexGrow: 1,
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center',
                ml: "12rem",
                mt: 1
              }}
            >
              {pages.map((page: string) => (
                <Link key={page} href={`/${page.toLowerCase()}`}>
                  <Button
                    key={page}
                    onClick={handleCloseNavMenu}
                    sx={{
                      color:
                        page.toLowerCase() === currentPage
                          ? 'primary.main'
                          : 'text.primary',
                      textShadow:
                        page.toLowerCase() === currentPage
                          ? 'rgb(240 1 79) 0rem 0rem 0.125rem'
                          : '',
                      '&:hover': {
                        color: 'primary.main',
                        background: 'transparent',
                        textShadow: 'rgb(240 1 79) 0rem 0rem 0.125rem'
                      }
                    }}
                  >
                    {page}
                  </Button>
                </Link>
              ))}
            </Box>

            {/* <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: "2.813rem" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {settings.map(setting => (
                  <MenuItem key={setting} onClick={handleCloseUserMenu}>
                    <Typography textAlign="center">{setting}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box> */}
            <Authentication />
          </Toolbar>
        </Container>
      </AppBar>
    </>
  )
}
export default Header
