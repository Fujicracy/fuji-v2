import CloseIcon from '@mui/icons-material/Close';
import {
  AppBar,
  Box,
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
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useCallback, useState } from 'react';
import { shallow } from 'zustand/shallow';

import { topLevelPages } from '../../../helpers/navigation';
import { hiddenAddress } from '../../../helpers/values';
import { AuthStatus, useAuth } from '../../../store/auth.store';
import { useNavigation } from '../../../store/navigation.store';
import styles from '../../../styles/components/Header.module.css';
import Banners from '../../Shared/Banners/Banners';
import { BurgerMenuIcon } from '../../Shared/Icons';
import AccountModal from './AccountModal/AccountModal';
import AddressAddon from './AddressAddon';
import BalanceAddon from './BalanceAddon';
import ChainSelect from './ChainSelect';
import NavigationItem from './NavigationItem';
import SocialMenu from './SocialMenu';
import SocialMenuWrapper from './SocialMenuWrapper';

const Header = () => {
  const theme = useTheme();
  const router = useRouter();
  const { setIsReferralModalOpen } = useNavigation();

  const { address, ens, status, balance, started, login } = useAuth(
    (state) => ({
      status: state.status,
      address: state.address,
      ens: state.ens,
      balance: state.balance,
      started: state.started,
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

  const handleOpenAccountModal = (show: boolean, element?: HTMLElement) => {
    setShowAccountModal(show);
    setAccountModalEl(element);
  };

  const onReferralClick = () => {
    if (!address || status !== AuthStatus.Connected) return;

    setIsReferralModalOpen(true);

    if (anchorElNav) {
      handleCloseNavMenu();
    }
  };

  return (
    <AppBar position="static">
      <Banners />

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
                {status === AuthStatus.Disconnected && (
                  <>
                    <Chip
                      data-cy="header-login"
                      label="Connect wallet"
                      variant="gradient"
                      sx={{
                        fontSize: '1rem',
                        ['@media screen and (max-width: 346px)']: {
                          fontSize: '0.6rem',
                        },
                      }}
                      onClick={() => login()}
                    />
                  </>
                )}
                {status === AuthStatus.Connected && <ChainSelect />}

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
                          <Link href={page.path} replace={true}>
                            <Typography variant="small">
                              {page.title}
                            </Typography>
                          </Link>
                        </ListItemText>
                      </MenuItem>
                    ))}
                    <MenuItem onClick={onReferralClick}>
                      <ListItemText>
                        <Typography variant="small">Referrals</Typography>
                      </ListItemText>
                    </MenuItem>
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
                        <ListItemText
                          onClick={(e) => {
                            handleOpenAccountModal(true, e.currentTarget);
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="small">
                              {formattedAddress}
                            </Typography>
                          </Stack>
                        </ListItemText>
                      </MenuItem>
                    )}
                    <Divider />
                    <SocialMenu />
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
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            {topLevelPages.map((page) => (
              <Link key={page.path} href={page.path} replace={true}>
                <NavigationItem
                  label={page.title}
                  isActive={isPageActive(page.path.toLowerCase())}
                />
              </Link>
            ))}

            <NavigationItem
              label={'Referrals'}
              type="New"
              onClick={onReferralClick}
            />
          </MenuList>
          <Grid
            container
            columnGap="0.5rem"
            justifyContent="flex-end"
            alignItems="center"
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {status === AuthStatus.Disconnected && (
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
                  onClick={() => login()}
                />
              </>
            )}
            {status === AuthStatus.Connected && address && (
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
                  <SocialMenuWrapper />
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
      {started && <AddressAddon />}
    </AppBar>
  );
};
export default Header;
