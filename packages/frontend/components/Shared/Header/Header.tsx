import CloseIcon from '@mui/icons-material/Close';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Fade,
  Grid,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ConnectOptions } from '@web3-onboard/core';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { shallow } from 'zustand/shallow';

import { topLevelPages } from '../../../helpers/navigation';
import { hiddenAddress } from '../../../helpers/values';
import { useAuth } from '../../../store/auth.store';
import styles from '../../../styles/components/Header.module.css';
import AccountModal from '../AccountModal';
import ChainSelect from '../ChainSelect';
import { BurgerMenuIcon } from '../Icons';
import ParameterLinks from '../ParameterLinks';
import Parameters from '../Parameters';
import BalanceAddon from './BalanceAddon';

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
  );
  const { palette } = useTheme();
  const router = useRouter();
  const currentPage = `/${router.pathname.substring(1)}`;

  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [accountModalEl, setAccountModalEl] = useState<
    HTMLElement | undefined
  >();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElNav(event.currentTarget);

  const handleCloseNavMenu = () => setAnchorElNav(null);
  const isNavMenuOpen = Boolean(anchorElNav);

  const formattedAddress = hiddenAddress(address);

  const handleOpenAccountModal = (
    show: boolean,
    element: HTMLElement | undefined
  ) => {
    setShowAccountModal(show);
    setAccountModalEl(element);
  };

  const handleLogin = (testing: boolean) => {
    const options: ConnectOptions | undefined = testing
      ? { autoSelect: { label: 'MetaMask', disableModals: true } }
      : undefined;
    login(options);
  };

  return (
    <AppBar position="static">
      <Box
        p="0 1.25rem"
        sx={{
          background: palette.background.paper,
          ['@media screen and (max-width: 346px)']: {
            p: '0 0.5rem',
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
                      maxWidth: '120px',
                      ['@media screen and (max-width: 346px)']: {
                        maxWidth: '100px',
                      },
                    }}
                  >
                    <img
                      src="/assets/images/logo/logo-title.svg"
                      alt="Logo Fuji"
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </Box>
                </a>
              </Link>
            </Grid>
            <Grid item>
              <Box
                sx={{
                  flexGrow: 1,
                  display: { xs: 'flex', lg: 'none' },
                  alignItems: 'center',
                }}
              >
                {status === 'disconnected' && (
                  <>
                    <Chip
                      label="Connect wallet"
                      variant="gradient"
                      sx={{
                        fontSize: '1rem',
                        ['@media screen and (max-width: 346px)']: {
                          fontSize: '0.6rem',
                        },
                      }}
                      onClick={() => handleLogin(false)}
                    />
                    <Button
                      data-cy="login"
                      onClick={() => handleLogin(true)}
                      sx={{ position: 'absolute', visibility: 'hidden' }}
                    >
                      e2e
                    </Button>
                  </>
                )}
                {status === 'connected' && <ChainSelect />}

                <IconButton
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  color="inherit"
                  onClick={handleOpenNavMenu}
                  sx={{ pr: '0' }}
                >
                  {isNavMenuOpen ? (
                    <CloseIcon
                      sx={{
                        background: palette.secondary.dark,
                        borderRadius: '100%',
                        fontSize: '12px',
                        padding: '8px',
                        width: '34px',
                        height: '34px',
                      }}
                    />
                  ) : (
                    <BurgerMenuIcon />
                  )}
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorElNav}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  keepMounted
                  open={Boolean(anchorElNav)}
                  onClose={handleCloseNavMenu}
                  sx={{ display: { xs: 'block', lg: 'none' } }}
                  TransitionComponent={Fade}
                >
                  <MenuList>
                    {topLevelPages.map((page) => (
                      <MenuItem key={page.path} onClick={handleCloseNavMenu}>
                        <ListItemText>
                          <Link href={page.path}>
                            <Typography variant="small">
                              {page.title}
                            </Typography>
                          </Link>
                        </ListItemText>
                      </MenuItem>
                    ))}
                    {address && <Divider />}
                    {address && (
                      <MenuItem
                        onClick={() => {
                          handleCloseNavMenu();
                          setAccountModalEl(
                            anchorElNav ? anchorElNav : undefined
                          );
                        }}
                      >
                        <ListItemText>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="small">
                              {formattedAddress}
                            </Typography>
                          </Stack>
                        </ListItemText>
                      </MenuItem>
                    )}
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
              display: { xs: 'none', lg: 'flex' },
              justifyContent: 'center',
            }}
          >
            {topLevelPages.map((page) => (
              <Link key={page.path} href={page.path}>
                <MenuItem
                  sx={{
                    color: currentPage.includes(page.path.toLowerCase())
                      ? 'primary.main'
                      : 'text.primary',
                    textShadow: currentPage.includes(page.path.toLowerCase())
                      ? `${palette.primary.main} 0rem 0rem 0.125rem`
                      : '',
                    '&:hover': {
                      color: 'primary.main',
                      background: 'transparent',
                      textShadow: `${palette.primary.main} 0rem 0rem 0.125rem`,
                    },
                  }}
                >
                  {page.title}
                </MenuItem>
              </Link>
            ))}
          </MenuList>

          <Grid
            container
            columnGap="0.5rem"
            justifyContent="flex-end"
            alignItems="center"
            sx={{ display: { xs: 'none', lg: 'flex' } }}
          >
            {status === 'disconnected' && (
              <>
                <Chip
                  label="Connect wallet"
                  variant="gradient"
                  sx={{
                    fontSize: '1rem',
                    ['@media screen and (max-width: 346px)']: {
                      fontSize: '0.6rem',
                    },
                  }}
                  onClick={() => handleLogin(false)}
                />
                <Button
                  data-cy="login"
                  onClick={() => handleLogin(true)}
                  sx={{ position: 'absolute', visibility: 'hidden' }}
                >
                  e2e
                </Button>
              </>
            )}
            {status === 'connected' && (
              <>
                <Grid item>
                  <ChainSelect />
                </Grid>
                <Grid item>
                  <BalanceAddon
                    balance={balance}
                    formattedAddress={formattedAddress}
                    ens={ens}
                    onClick={(e) => handleOpenAccountModal(true, e)}
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
      {address && (
        <AccountModal
          isOpen={showAccountModal}
          anchorEl={accountModalEl}
          closeAccountModal={() => handleOpenAccountModal(false, undefined)}
          address={address}
        />
      )}
    </AppBar>
  );
};
export default Header;
