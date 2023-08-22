import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { AssetType } from '../../helpers/assets';
import { NetworkIcon, ProviderIcon } from '../Shared/Icons';
import APRChange from './APRChange';
import AssetMigrationChange from './AssetMigrationChange';
import InfoWithIcon from './InfoWithIcon';
import PositionHealth from './PositionHealth';

type MigrateToProps = {
  onNext: () => void;
};

function MigrateTo({ onNext }: MigrateToProps) {
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
            <AssetMigrationChange type={AssetType.Collateral} />
          </Box>

          <Box mt={1}>
            <AssetMigrationChange type={AssetType.Debt} />
          </Box>

          <Box mt={2}>
            <PositionHealth value={55} maxLTV={80} recommendedLTV={75} />
          </Box>

          <Grid container justifyContent="space-between" mt={1.5}>
            <Typography variant="smallDark">Net APR</Typography>

            <APRChange type={AssetType.Debt} start={2.09} end={3.36} />
          </Grid>

          <Grid container justifyContent="space-between" mt={1.5}>
            <Typography variant="smallDark">Bridge fees</Typography>

            <Typography variant="small">Bridge fees</Typography>
          </Grid>

          <Grid container justifyContent="space-between" mt={1.5}>
            <Typography variant="smallDark">Est, processing time</Typography>

            <Typography variant="small">~2 Mins</Typography>
          </Grid>

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
