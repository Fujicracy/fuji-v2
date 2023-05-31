import {
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
import React, { useState } from 'react';

import { useBorrow } from '../../store/borrow.store';
import Vault from './Vault';

function VaultsSelect() {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('md'));

  const [selectedRoute, setSelectedRoute] = useState(0);
  const availableRoutes = useBorrow((state) => state.availableRoutes);
  const availableVaults = useBorrow((state) => state.availableVaults);
  const changeActiveVault = useBorrow((state) => state.changeActiveVault);
  const aggregatedData = availableVaults.map((vault, i) => ({
    ...vault,
    route: availableRoutes[i],
  }));

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

  return (
    <Stack sx={{ mb: '2rem' }}>
      <Typography variant="body2">All Vaults</Typography>
      <Card
        sx={{
          flexDirection: 'column',
          alignItems: 'center',
          p: '1.5rem 1rem',
          width: '100%',
          mt: '1rem',
        }}
      >
        <CardContent sx={{ padding: 0 }}>
          <TableContainer
            sx={{
              overflowY: 'hidden',
              border: 'none',
              '& td, th': {
                padding: '0 0.7rem',
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
                <TableRow sx={{ height: '2.625rem' }}>
                  <TableCell align="left">Protocols</TableCell>
                  <TableCell align="left">Safety Rating</TableCell>
                  <TableCell align="left">Network</TableCell>
                  <TableCell align="right">Supply APY</TableCell>
                  <TableCell align="right">Borrow APR</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {aggregatedData.map((item, i) => (
                  <Vault
                    key={i}
                    selected={i === selectedRoute}
                    data={item}
                    onChange={() => didSelectRoute(i)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default VaultsSelect;
