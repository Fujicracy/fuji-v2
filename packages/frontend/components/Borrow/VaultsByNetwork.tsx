import {
  Card,
  CardContent,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { BasePosition } from '../../helpers/positions';
import { useBorrow } from '../../store/borrow.store';

type OverviewProps = {
  isEditing: boolean;
  basePosition: BasePosition;
};

function VaultsByNetwork({ basePosition, isEditing }: OverviewProps) {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('md'));

  const vault = useBorrow((state) => state.activeVault);

  return (
    <Stack>
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
        <CardContent sx={{ padding: 0, gap: '1rem' }}></CardContent>
      </Card>
    </Stack>
  );
}

export default VaultsByNetwork;
