import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  Button,
  Card,
  CardContent,
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
import React, { useEffect, useMemo, useState } from 'react';

import { useBorrow } from '../../store/borrow.store';
import Vault from './Vault';

function VaultsSelect() {
  const { breakpoints, palette } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('md'));

  const [isUnFolded, setUnFolded] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [openedRoute, setOpenedRoute] = useState<number | null>(null);
  const availableRoutes = useBorrow((state) => state.availableRoutes);
  const availableVaults = useBorrow((state) => state.availableVaults);
  const changeActiveVault = useBorrow((state) => state.changeActiveVault);
  const aggregatedData = availableVaults.map((vault, i) => ({
    ...vault,
    route: availableRoutes[i],
    index: i,
  }));

  function handleOpen(i: number) {
    setOpenedRoute(i === openedRoute ? null : i);
  }

  function didSelectRoute(i: number) {
    if (selectedRoute !== i) {
      const vault = availableVaults.find(
        (v) => v.vault.address.value === availableRoutes[i].address
      );
      if (!vault) return;
      changeActiveVault(vault);
    }
    setSelectedRoute(i);
  }

  const filteredRoutes = useMemo(() => {
    if (!aggregatedData.length) return [];
    if (isUnFolded) return aggregatedData;

    const selected = aggregatedData.find(
      (data) => data.index === selectedRoute
    );

    return [
      selected,
      ...aggregatedData
        .filter((data) => data.index !== selected?.index)
        .slice(0, 1),
    ];
  }, [aggregatedData, isUnFolded, selectedRoute]);

  useEffect(() => {
    setUnFolded(false);
    setSelectedRoute(0);
    setOpenedRoute(null);
  }, [availableRoutes, availableVaults]);

  return (
    <Stack sx={{ mb: '2rem', width: '100%' }}>
      <Typography variant="body2">All Vaults</Typography>
      <Card
        sx={{
          flexDirection: 'column',
          alignItems: 'start',
          p: isMobile
            ? '1rem 0.5rem'
            : `1.5rem 1.7rem ${
                availableRoutes.length > 1 ? '0' : '1.5rem'
              } 1.7rem`,
          width: '100%',
          mt: '1rem',
          position: 'relative',
          backgroundColor: '#191B1F',
        }}
      >
        <CardContent sx={{ padding: 0, width: '100%' }}>
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
              'tr td:first-of-type': { borderLeftStyle: 'solid' },
            }}
          >
            <Table
              aria-label="Vault select"
              size="small"
              sx={{ borderCollapse: 'separate' }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    height: '2.625rem',
                    '& .MuiTableCell-root': { color: '#787883' },
                  }}
                >
                  <TableCell align="left">Protocols</TableCell>
                  <TableCell align="left">Safety Rating</TableCell>
                  {!isMobile && (
                    <>
                      <TableCell align="left">Network</TableCell>
                      <TableCell align="right">Supply APY</TableCell>
                    </>
                  )}
                  <TableCell align="right">Borrow APR</TableCell>
                  {!isMobile && <TableCell align="right" />}
                </TableRow>
              </TableHead>
              <TableBody
                sx={{
                  '& tr:nth-child(3)': {
                    opacity: isUnFolded ? 1 : 0.25,
                  },
                }}
              >
                {filteredRoutes.length > 0 &&
                  filteredRoutes.map((item) => {
                    return (
                      item && (
                        <Vault
                          key={item.index}
                          selected={item.index === selectedRoute}
                          data={item}
                          onChange={() => didSelectRoute(item.index)}
                          opened={item.index === openedRoute}
                          setOpened={() => handleOpen(item.index)}
                          isMobile={isMobile}
                        />
                      )
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>

        {availableRoutes.length > 1 && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            sx={
              isUnFolded
                ? {
                    position: 'relative',
                    height: '3rem',
                    width: '100%',
                  }
                : {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    width: '100%',
                    height: '3rem',
                    zIndex: 5,
                  }
            }
          >
            <Button
              size="small"
              variant="secondary"
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
              onClick={() => setUnFolded(!isUnFolded)}
            >
              {isUnFolded ? 'Close' : 'See All Vaults'}
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

export default VaultsSelect;
