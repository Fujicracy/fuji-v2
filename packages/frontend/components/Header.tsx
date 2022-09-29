import { useState } from 'react'
import { useTheme } from '@mui/material/styles'
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
  MenuList
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import Image from 'next/image'
import { useRouter } from 'next/router'

import styles from '../styles/components/Header.module.css'
import Authentication from './Authentication'

const pages = ['Markets', 'Borrow', 'Lend', 'My positions', 'Theming'] // TODO: "Theming" page is for tests

const Header = () => {
  const theme = useTheme()
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null)
  const router = useRouter()
  const currentPage = router.pathname.substring(1) // TODO: Maybe not the best way

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElNav(event.currentTarget)

  const handleCloseNavMenu = () => setAnchorElNav(null)

  return (
    <>
      <AppBar position='static'>
        <Container
          maxWidth='xl'
          sx={{ background: theme.palette.background.paper }}
        >
          <Toolbar disableGutters>
            <Link href='/'>
              <a className={styles.logoTitle}>
                <Image
                  src='/assets/images/logo/logo-title.svg'
                  alt='Logo Fuji'
                  width={120}
                  height={80}
                  layout='fixed'
                />
              </a>
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
                      <Typography align='center'>{page}</Typography>
                    </Link>
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            <MenuList
              sx={{
                flexGrow: 1,
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center',
                ml: '12rem',
                mt: 1
              }}
            >
              {pages.map((page: string) => (
                <MenuItem
                  key={page}
                  sx={{
                    color:
                      page.toLowerCase() === currentPage
                        ? 'primary.main'
                        : 'text.primary',
                    textShadow:
                      page.toLowerCase() === currentPage
                        ? `${theme.palette.primary.main} 0rem 0rem 0.125rem`
                        : '',
                    '&:hover': {
                      color: 'primary.main',
                      background: 'transparent',
                      textShadow: `${theme.palette.primary.main} 0rem 0rem 0.125rem`
                    }
                  }}
                >
                  <Link href={`/${page.toLowerCase()}`}>{page}</Link>
                </MenuItem>
              ))}
            </MenuList>
            <Authentication />
          </Toolbar>
        </Container>
      </AppBar>
    </>
  )
}
export default Header
