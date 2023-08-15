import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  Button,
  Card,
  CardContent,
  Collapse,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AbstractVault, VaultType } from '@x-fuji/sdk';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { FetchStatus } from '../../../../helpers/assets';
import { useBorrow } from '../../../../store/borrow.store';
import { useLend } from '../../../../store/lend.store';
import { useNavigation } from '../../../../store/navigation.store';
import Vault from './Vault';

type VaultSelectProps = {
  type?: VaultType;
};

function VaultSelect({ type = VaultType.BORROW }: VaultSelectProps) {
  const { breakpoints, palette } = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(breakpoints.down('md'));
  const useStore = type === VaultType.BORROW ? useBorrow : useLend;
  const collateral = useStore().collateral;
  const debt = useBorrow().debt;
  const activeVault = useStore().activeVault;
  const availableRoutes = useStore().availableRoutes;
  const availableVaults = useStore().availableVaults;
  const status = useStore().availableVaultsStatus;
  const changeActiveVault = useStore().changeActiveVault;

  const prevVault = useRef<AbstractVault | undefined>(undefined);

  const hasNoAvailableVaults =
    status === FetchStatus.Ready && availableVaults.length === 0;
  const override = useNavigation(
    (state) =>
      (type === VaultType.BORROW ? state.borrowPage : state.lendPage)
        .shouldReset
  );

  const preselect = () => {
    let selected = 0;

    if (!override) {
      for (let i = 0; i < availableVaults.length; i++) {
        if (
          activeVault?.address.value === availableVaults[i]?.vault.address.value
        ) {
          selected = i;
        }
      }
    }
    return selected;
  };

  const [isUnFolded, setUnFolded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(preselect());
  const [openedRoute, setOpenedRoute] = useState<number | null>(null);
  const [openedRouteHeight, setOpenedHeight] = useState<number>(0);

  const aggregatedData = availableVaults.map((vault, i) => ({
    ...vault,
    route: availableRoutes[i],
    index: i,
  }));

  function handleOpen(i: number) {
    setOpenedRoute(i === openedRoute ? null : i);
  }

  const didSelectRoute = (i: number) => {
    if (selectedRoute !== i) {
      const vault = availableVaults.find(
        (v) => v.vault.address.value === availableRoutes[i]?.address
      );
      if (!vault) return;
      changeActiveVault(vault);
    }

    setSelectedRoute(i);
    setOpenedRoute(null);
    setUnFolded(false);
  };

  const filteredRoutes = useMemo(() => {
    if (!aggregatedData.length) return [];
    if (isUnFolded) return aggregatedData;

    const selected = aggregatedData.find(
      (data) => data.index === selectedRoute
    );

    return [
      selected,
      ...aggregatedData.filter((data) => data.index !== selected?.index),
    ];
  }, [aggregatedData, isUnFolded, selectedRoute]);

  const onOpen = ({ height, index }: { height: number; index: number }) => {
    handleOpen(index);
    setOpenedHeight(height);
  };

  const handleToggleFolded = () => {
    if (!isUnFolded) {
      setUnFolded(true);
      return;
    }

    setUnFolded(false);
    setOpenedRoute(null);
  };

  useEffect(() => {
    if (type === VaultType.BORROW) return;
    setIsLoading(true);
    // We want to make sure to only set the selected route if we have no previous value
    if (activeVault && prevVault.current === undefined) {
      prevVault.current = activeVault;
      setSelectedRoute(preselect());
    }
    setOpenedRoute(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVault, collateral.currency.wrapped.symbol, router.pathname, type]);

  useEffect(() => {
    if (type === VaultType.LEND) return;
    setIsLoading(true);
    // setSelectedRoute(2);
    setOpenedRoute(null);
  }, [
    collateral.chainId,
    debt?.chainId,
    collateral.currency.wrapped.symbol,
    debt?.currency.wrapped.symbol,
    router.pathname,
    type,
  ]);

  useEffect(() => {
    // We do this because we already have availableRoutes and it is changing and no ways to track it
    if (isLoading) {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableRoutes, collateral, debt]);

  if (hasNoAvailableVaults) return null;

  console.warn(activeVault?.chainId, selectedRoute);

  return (
    <Stack
      sx={
        isMobile
          ? {
              width: 'calc(100% - 1rem)',
              m: '0 0.5rem',
              mb: { xs: '1rem', sm: '3.5rem' },
            }
          : { width: '100%', mb: '2rem' }
      }
    >
      <Typography variant="body2">All Vaults</Typography>
      <Card
        sx={{
          flexDirection: 'column',
          alignItems: 'start',
          p: isMobile
            ? `1rem 0.5rem ${isUnFolded ? '2.5' : '1'}rem 0.5rem`
            : `1.5rem 1.5rem ${
                filteredRoutes.length === 1
                  ? '1rem'
                  : isUnFolded
                  ? '2.5rem'
                  : '0'
              } 1.5rem`,
          width: '100%',
          mt: '1rem',
          position: 'relative',
          transition: 'all 500ms',
        }}
      >
        <CardContent sx={{ padding: 0, width: '100%' }}>
          {isLoading ? (
            <Skeleton
              sx={{
                width: '100%',
                height: '9.2rem',
              }}
            />
          ) : (
            <Collapse
              in={isUnFolded}
              collapsedSize={
                filteredRoutes.length > 1
                  ? openedRoute !== null
                    ? `${150 + openedRouteHeight}px`
                    : '150px'
                  : openedRoute !== null
                  ? `${108 + openedRouteHeight}px`
                  : '108px'
              }
              timeout={{ enter: 500, exit: 500 }}
            >
              <TableContainer
                sx={{
                  overflowY: 'hidden',
                  border: 'none',
                  '& td, th': {
                    padding: '0 0.5rem',
                  },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                  '& .MuiTableCell-root': { border: 'none' },
                  '& tr:first-of-type td:first-of-type': {
                    borderTopLeftRadius: '0.5rem',
                  },
                  '& tr:first-of-type td:last-of-type': {
                    borderTopRightRadius: '0.5rem',
                  },
                  '& tr:last-of-type td:first-of-type': {
                    borderBottomLeftRadius: '0.5rem',
                  },
                  '& tr:last-of-type td:last-of-type': {
                    borderBottomRightRadius: '0.5rem',
                  },
                  'tr:first-of-type td': { borderTopStyle: 'solid' },
                  'tr td:first-of-type': {
                    borderLeftStyle: 'solid',
                    width: 'fit-content',
                  },
                  'tr td:not(:first-of-type)': {
                    // width: '70px',
                  },
                }}
              >
                <Table
                  aria-label="Vault select"
                  size="small"
                  sx={{
                    borderCollapse: 'separate',
                    tableLayout: !isMobile ? 'auto' : 'fixed',
                  }}
                >
                  <TableHead>
                    <TableRow
                      sx={{
                        height: '2.625rem',
                        '& .MuiTableCell-root': { color: '#787883' },
                      }}
                    >
                      <TableCell align="left" width="45%">
                        Protocols
                      </TableCell>
                      <TableCell align="left" width="20%">
                        Safety Rating
                      </TableCell>
                      {!isMobile && <TableCell align="left">Network</TableCell>}
                      {(!isMobile || type === VaultType.LEND) && (
                        <TableCell
                          align="right"
                          width={isMobile ? '35%' : 'auto'}
                        >
                          Supply APY
                        </TableCell>
                      )}
                      {type === VaultType.BORROW && (
                        <TableCell align="right" width="35%">
                          Borrow APR
                        </TableCell>
                      )}
                      {!isMobile && <TableCell align="right" />}
                    </TableRow>
                  </TableHead>
                  <TableBody
                    sx={{
                      '& tr:nth-of-type(3)': {
                        opacity: isUnFolded ? 1 : 0.25,
                        transition: 'all 500ms',
                      },
                    }}
                  >
                    {filteredRoutes.length > 0 &&
                      filteredRoutes.map((item) => {
                        return (
                          item && (
                            <Vault
                              key={item.index}
                              type={type}
                              selected={item.index === selectedRoute}
                              data={item}
                              onChange={() => didSelectRoute(item.index)}
                              opened={item.index === openedRoute}
                              setOpened={onOpen}
                              isMobile={isMobile}
                            />
                          )
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          )}
        </CardContent>

        {!isLoading && filteredRoutes.length > 1 && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              height: '3rem',
              zIndex: 5,
            }}
          >
            <Button
              size="small"
              variant="text"
              sx={{
                p: '0.1rem 0.5rem 0.1rem 1rem',
                backgroundColor: palette.secondary.dark,
                border: 'none',
                borderRadius: '100px',
                '&:hover': {
                  opacity: 1,
                  backgroundColor: palette.secondary.light,
                },
              }}
              onClick={handleToggleFolded}
            >
              <Typography variant="small">
                {isUnFolded ? 'Hide' : 'See All Vaults'}
              </Typography>
              <KeyboardArrowDownIcon
                sx={{
                  ml: '0px !important',
                  transform: isUnFolded ? 'rotate(180deg)' : '',
                }}
              />
            </Button>
          </Stack>
        )}
      </Card>
    </Stack>
  );
}

export default VaultSelect;
