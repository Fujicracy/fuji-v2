import { Card, CardContent, Stack, Typography } from '@mui/material';

import { NetworkIcon, ProviderIcon } from '../Shared/Icons';
import InfoWithIcon from './InfoWithIcon';

function MigrateFrom() {
  return (
    <Card sx={{ maxWidth: '400px' }}>
      <CardContent sx={{ p: 3, width: '100%', mb: 3 }}>
        <Typography variant="small" fontWeight={500}>
          Migrate From
        </Typography>
        <Stack direction="row" justifyContent="space-between" gap={1} mt={1}>
          <InfoWithIcon
            icon={
              <ProviderIcon provider={'Compound V2'} width={18} height={18} />
            }
            text="Compound V2"
          />
          <InfoWithIcon
            icon={<NetworkIcon network={1} width={18} height={18} />}
            text="Ethereum"
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default MigrateFrom;
