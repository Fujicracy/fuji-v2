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
          p: '1.5rem 2rem',
          width: '100%',
          mt: '1rem',
        }}
      >
        <CardContent sx={{ padding: 0, gap: '1rem' }}>
          <TableContainer
            sx={{
              border: 'none',
              '& .MuiTableCell-root': { border: 'none' },
              '& tr:first-child td:first-child': {
                borderTopLeftRadius: '0.5rem',
              },
              '& tr:first-child td:last-child': {
                borderTopRightRadius: '0.5rem',
              },
              '& tr:last-child td:first-child': {
                borderBottomLeftRadius: '0.5rem',
              },
              '& tr:last-child td:last-child': {
                borderBottomRightRadius: '0.5rem',
              },
              'tr:first-child td': { borderTopStyle: 'solid' },
              'tr td:first-child': { borderLeftStyle: 'solid' },
            }}
          >
            <Table
              aria-label="Vault select"
              size="small"
              sx={{ borderCollapse: 'separate' }}
            >
              <TableHead>
                <TableRow sx={{ height: '2.625rem' }}>
                  <TableCell align="left">Vault</TableCell>
                  <TableCell align="left">Rating</TableCell>
                  <TableCell align="right">Network</TableCell>
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
