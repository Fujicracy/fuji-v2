import {
  Box,
  Button,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { chainName } from '../../helpers/chains';
import { PositionRow } from '../../helpers/positions';
import { formatValue } from '../../helpers/values';
import { useAuth } from '../../store/auth.store';
import { NetworkIcon, ProviderIcon } from '../Shared/Icons';

type MigratePositionTableProps = {
  loading: boolean;
  rows: PositionRow[];
  onClick: (row: PositionRow) => void;
  selected: PositionRow | null;
  marketLink: string;
  onNext: () => void;
};

function MigratePositionTable({
  loading,
  rows,
  onClick,
  selected,
  marketLink,
  onNext,
}: MigratePositionTableProps) {
  const { palette } = useTheme();
  const account = useAuth((state) => state.address);
  const login = useAuth((state) => state.login);

  const numberOfColumns = 4;

  if (!account) {
    return (
      <Box sx={{ borderRadius: 0.5, p: 3, background: palette.secondary.dark }}>
        <Stack direction="column" alignItems="center" justifyContent="center">
          <Typography variant="h5">
            {"You don't have wallet connected"}
          </Typography>
          <Button
            variant="secondary"
            size="medium"
            onClick={() => login()}
            sx={{
              mt: 3,
            }}
          >
            Connect Wallet
          </Button>
        </Stack>
      </Box>
    );
  }

  if (loading) {
    return (
      <MigratePositionTableContainer isLend={false}>
        <TableRow sx={{ height: '3rem' }}>
          {new Array(numberOfColumns).fill('').map((_, index) => (
            <TableCell key={index}>
              <Skeleton />
            </TableCell>
          ))}
        </TableRow>
      </MigratePositionTableContainer>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <Box sx={{ borderRadius: 0.5, p: 3, background: palette.secondary.dark }}>
        <Stack direction="column" alignItems="center" justifyContent="center">
          <Typography variant="h5">
            {"You don't have any open positions"}
          </Typography>
          <Typography mt={1}>{"Let's change that!"}</Typography>
          <Button
            variant="secondary"
            size="medium"
            onClick={() => window.open(marketLink, '_blank')}
            sx={{
              mt: 3,
            }}
          >
            View Markets
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <>
      <MigratePositionTableContainer isLend={false}>
        <>
          {rows.map((row, i) => (
            <TableRow
              key={i}
              onClick={() => onClick(row)}
              sx={{
                cursor: 'pointer',
                height: '3rem',
                borderRadius: '0.5rem',
                border: `1px solid ${
                  selected?.address === row.address ? '#2A2E35' : 'transparent'
                }`,
                '& .MuiTableCell-root': {
                  background:
                    selected?.address === row.address
                      ? `${palette.secondary.dark}`
                      : 'transparent',
                  '&:last-of-type': {
                    borderTopRightRadius: '0.5rem',
                    borderBottomRightRadius: '0.5rem',
                  },
                  '&:first-of-type': {
                    borderTopLeftRadius: '0.5rem',
                    borderBottomLeftRadius: '0.5rem',
                  },
                },
                '&:hover': {
                  '& .MuiTableCell-root': {
                    background: palette.secondary.dark,
                  },
                },
              }}
            >
              <TableCell align="left">
                <Stack
                  direction="row"
                  justifyContent="flex-start"
                  alignItems="center"
                >
                  <ProviderIcon
                    provider={row.activeProvidersNames[0]}
                    width={24}
                    height={24}
                  />
                  <Typography variant="small" fontWeight={500} ml={1}>
                    {row.activeProvidersNames[0]}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell align="left">
                <Stack
                  direction="row"
                  justifyContent="flex-start"
                  alignItems="center"
                >
                  <NetworkIcon
                    network={chainName(row.chainId)}
                    width={18}
                    height={18}
                  />
                </Stack>
              </TableCell>
              <TableCell align="right">
                <Typography variant="small" fontWeight={500}>
                  {formatValue(row.debt?.usdValue, {
                    style: 'currency',
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="small" fontWeight={500}>
                  {formatValue(row.collateral.usdValue, {
                    style: 'currency',
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </>
      </MigratePositionTableContainer>

      <Button
        fullWidth
        variant="gradient"
        size="medium"
        disabled={!selected}
        onClick={onNext}
        sx={{
          mt: 3,
        }}
      >
        Next
      </Button>
    </>
  );
}

export default MigratePositionTable;

type PositionYieldTableElementProps = {
  isLend: boolean;
  children: string | JSX.Element | JSX.Element[];
};

function MigratePositionTableHeader() {
  return (
    <TableHead
      sx={{
        height: '2.625rem',
        '& .MuiTableCell-root': { color: '#787883' },
      }}
    >
      <TableRow sx={{ height: '2.625rem' }}>
        <TableCell align="left">Protocol</TableCell>
        <TableCell align="left">Chain</TableCell>
        <TableCell align="right">Borrow Value</TableCell>
        <TableCell align="right">Collateral Value</TableCell>
      </TableRow>
    </TableHead>
  );
}

function MigratePositionTableContainer({
  children,
  isLend,
}: PositionYieldTableElementProps) {
  return (
    <TableContainer
      sx={{
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        border: 'none',
        '& .MuiTableCell-root': { border: 'none' },
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      <Table aria-label="Positions Migrator table" size="small">
        <MigratePositionTableHeader />
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  );
}
