import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { PositionRow } from '../../helpers/positions';
import { NetworkIcon, ProviderIcon } from '../Shared/Icons';
import InfoWithIcon from './InfoWithIcon';
import PositionHealth from './PositionHealth';

type MigrateToProps = {
  onNext: () => void;
  position: PositionRow;
};

function MigrateTo({ position, onNext }: MigrateToProps) {
  const { palette } = useTheme();

  return (
    <Stack direction="column" justifyContent="flex-start" textAlign="left">
      <Card sx={{ maxWidth: '400px' }}>
        <CardContent sx={{ p: 3, width: '100%', mb: 3 }}>
          <Typography variant="small" fontWeight={500}>
            Migrate To
          </Typography>

          <Stack direction="row" justifyContent="space-between" gap={1} mt={1}>
            <InfoWithIcon
              icon={
                <ProviderIcon provider={'Compound V3'} width={18} height={18} />
              }
              text="Compound V3"
            />
            <InfoWithIcon
              icon={<NetworkIcon network={1} width={18} height={18} />}
              text="Ethereum"
            />
          </Stack>

          <Box mt={2}>
            <PositionHealth value={20} maxLTV={80} recommendedLTV={75} />
          </Box>

          <Button
            fullWidth
            variant="gradient"
            size="medium"
            disabled={false}
            onClick={onNext}
            sx={{
              mt: 3,
            }}
          >
            Approve and Migrate
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default MigrateTo;
