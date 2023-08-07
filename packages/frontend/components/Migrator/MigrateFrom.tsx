import { Card, CardContent, Stack, Typography } from '@mui/material';

import { useBorrow } from '../../store/borrow.store';
import FujiRadioGroup from '../Shared/FujiRadioGroup';
import { NetworkIcon, ProviderIcon } from '../Shared/Icons';
import AssetRadioLabel from './AssetRadioLabel';
import InfoWithIcon from './InfoWithIcon';

function MigrateFrom() {
  const collateral = useBorrow((state) => state.collateral);

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

        <Stack direction="column" justifyContent="left" gap={1} mt={1.5}>
          <FujiRadioGroup
            label="Collateral Asset (Select Only 1)"
            values={[
              {
                value: 0.08,
                label: (
                  <AssetRadioLabel
                    currency={collateral.currency}
                    amount={0.008}
                  />
                ),
              },
              {
                value: 0.01,
                label: (
                  <AssetRadioLabel
                    currency={collateral.currency}
                    amount={0.088}
                  />
                ),
              },
            ]}
          />
        </Stack>
        <Stack direction="column" justifyContent="left" gap={1} mt={1.5}>
          <FujiRadioGroup
            label="Borrow Asset"
            values={[
              {
                value: 0.08,
                label: (
                  <AssetRadioLabel
                    currency={collateral.currency}
                    amount={0.008}
                  />
                ),
              },
            ]}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default MigrateFrom;
