import {
  Button,
  Stack,
  TableCell,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { VaultWithFinancials } from '@x-fuji/sdk';
import React from 'react';

import { chainName } from '../../helpers/chains';
import { RouteMeta } from '../../helpers/routing';
import BestLabel from '../Markets/BestLabel';
import { NetworkIcon } from '../Shared/Icons';
import IntegratedProviders from '../Shared/Table/IntegratedProviders';
import SafetyRating from '../Shared/Table/SafetyRating';

type VaultProps = {
  selected: boolean;
  data: VaultWithFinancials & { route: RouteMeta };
  onChange: () => void;
};

function Vault({ selected, data, onChange }: VaultProps) {
  const { palette } = useTheme();

  return (
    <TableRow
      sx={{
        cursor: 'pointer',
        height: '3.375rem',
        borderRadius: '0.5rem',
        border: selected
          ? `1px solid ${alpha(palette.secondary.light, 0.5)}`
          : 'none',
        backgroundColor: selected ? `${palette.secondary.dark}` : 'transparent',
        '&:hover': {
          '& .MuiTableCell-root': { background: '#34363E' },
        },
      }}
      onClick={onChange}
    >
      <TableCell align="left">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="start"
          gap={1.3}
        >
          <IntegratedProviders
            providers={{
              status: 0,
              value: data.allProviders!.map((p) => p.name),
            }}
          />
          {data.route.recommended && <BestLabel />}
        </Stack>
      </TableCell>
      <TableCell align="left">
        <SafetyRating
          rating={Number(data.vault?.safetyRating?.toString()) ?? 0}
        />
      </TableCell>
      <TableCell>
        <Stack direction="row" alignItems="center" gap="0.5rem">
          <NetworkIcon
            network={chainName(data.vault.chainId)}
            width={18}
            height={18}
          />
          {chainName(data.vault.chainId)}
        </Stack>
      </TableCell>
      <TableCell>
        <Button size="small" fullWidth variant="secondary" sx={{ p: '0 1rem' }}>
          <Typography variant="small">View Details</Typography>
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default Vault;