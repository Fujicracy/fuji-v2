import {
  capitalize,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { PositionRow } from '../../helpers/positions';
import MigratePositionTable from './MigratePositionTable';

type MigratePositionProps = {
  rows: PositionRow[];
  loading: boolean;
  selected: PositionRow | null;
  setSelected: (row: PositionRow) => void;
  onNext: () => void;
  provider: string;
};

function MigratePosition({
  rows,
  loading,
  selected,
  setSelected,
  onNext,
  provider,
}: MigratePositionProps) {
  const { palette } = useTheme();
  return (
    <Stack direction="column" justifyContent="center" textAlign="center">
      <Typography variant="label" color={palette.primary.light}>
        Fuji Finance X {capitalize(provider)}
      </Typography>
      <Typography variant="h4" mt={1}>
        Position Migrator
      </Typography>
      <Card sx={{ maxWidth: '640px', mt: 3 }}>
        <CardContent sx={{ p: 3, width: '100%', mb: 3, textAlign: 'center' }}>
          <Stack sx={{ width: '100%', pb: 1.5 }}>
            <Typography variant="small" fontWeight={500}>
              Select Position to Migrate
            </Typography>
          </Stack>

          <Divider sx={{ mb: 1.5 }} />

          <MigratePositionTable
            onNext={onNext}
            loading={loading}
            rows={rows}
            onClick={setSelected}
            selected={selected}
            marketLink={'https://app.compound.finance/'}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}

export default MigratePosition;
