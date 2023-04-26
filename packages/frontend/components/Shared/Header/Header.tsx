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
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ConnectOptions } from '@web3-onboard/core';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
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
import BetaBanner from './BetaBanner';

const Header = () => {
  const theme = useTheme();
  const router = useRouter();

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

  const { palette } = theme;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currentPage = router.asPath;

  const isPageActive = useCallback(
    (path: string) => {
      return (
        (currentPage === '/' && path === '/') ||
        (path !== '/' && currentPage.includes(path))
      );
    },
    [currentPage]
  );

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
        <Toolbar
          disableGutters
          sx={{ '@media (min-width: 600px)': { minHeight: '4.75rem' } }}
        >
          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: { xs: '100%', md: 'unset' } }}
          >
            <Grid item>
              <Link href="/" legacyBehavior>
                <a className={styles.logoTitle}>
                  <Box
                    maxWidth={isMobile ? 120 : 180}
                    maxHeight={50}
                    sx={{
                      width: '12rem',
                    }}
                  >
                    <img
                      src="/assets/images/logo/logo-title.svg"
                      alt="Logo Fuji"
                      style={
                        isMobile
                          ? { width: '100%', height: 'auto' }
                          : { marginLeft: '10px', height: '30px' }
                      }
                    />
                  </Box>
                </a>
              </Link>
            </Grid>
            <Grid item>
              <Box
                sx={{
                  flexGrow: 1,
                  display: { xs: 'flex', md: 'none' },
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
                  sx={{ display: { xs: 'block', md: 'none' } }}
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
              display: { xs: 'none', md: 'flex' },
              ml: '1rem',
              justifyContent: 'center',
              gap: '0.25rem',
            }}
          >
            {topLevelPages.map((page) => (
              <Link key={page.path} href={page.path}>
                <MenuItem
                  sx={{
                    lineHeight: '160%',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: isPageActive(page.path.toLowerCase())
                      ? palette.text.primary
                      : palette.info.main,
                    background: isPageActive(page.path.toLowerCase())
                      ? alpha('#25262A', 0.7)
                      : 'transparent',
                    p: '0.375rem 1rem',
                    borderRadius: '10px',
                    '&:hover': {
                      color: palette.text.primary,
                      background: alpha('#25262A', 0.7),
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
            sx={{ display: { xs: 'none', md: 'flex' } }}
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
            {status === 'connected' && address && (
              <>
                <Grid item>
                  <ChainSelect />
                </Grid>
                <Grid item>
                  <BalanceAddon
                    balance={balance}
                    address={address}
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
      <BetaBanner />
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
