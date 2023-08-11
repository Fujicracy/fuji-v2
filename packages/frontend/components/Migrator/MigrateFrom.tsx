import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import React from 'react';

import { useBorrow } from '../../store/borrow.store';
import FujiRadioGroup from '../Shared/FujiRadioGroup';
import { NetworkIcon, ProviderIcon } from '../Shared/Icons';
import WarningInfo from '../Shared/WarningInfo';
import AssetRadioLabel from './AssetRadioLabel';
import InfoWithIcon from './InfoWithIcon';

type MigrateFromProps = {
  onBack: () => void;
};

function MigrateFrom({ onBack }: MigrateFromProps) {
  const collateral = useBorrow((state) => state.collateral);
  const { palette } = useTheme();

  return (
    <Stack direction="column" justifyContent="flex-start" textAlign="left">
      <Stack
        flexDirection="row"
        alignItems="center"
        onClick={onBack}
        sx={{
          cursor: 'pointer',
          mt: { xs: '0', sm: '-2.5rem' },
          mb: '1rem',
        }}
      >
        <Image
          src="/assets/images/shared/arrowBack.svg"
          height={14}
          width={16}
          alt="Arrow Back"
        />
        <Typography variant="small" ml="0.75rem" color={palette.info.main}>
          Back to select position
        </Typography>
      </Stack>
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

          <Box mt={3}>
            <WarningInfo
              withoutIcon
              text={
                'While migrating debt, the process involves repaying your debt on the source chain prior to taking on a new debt on the destination chain'
              }
            />
          </Box>

          <Button
            fullWidth
            variant="gradient"
            size="medium"
            disabled={true}
            onClick={() => false}
            sx={{
              mt: 3,
            }}
          >
            Next
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default MigrateFrom;
