import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { AssetType } from '../../helpers/assets';
import { formatAssetWithSymbol } from '../../helpers/values';
import { CurrencyIcon } from '../Shared/Icons';

type AssetMigrationChangeProps = {
  type: AssetType;
};

function AssetMigrationChange({ type }: AssetMigrationChangeProps) {
  const { palette } = useTheme();

  const labels =
    type === AssetType.Debt
      ? {
          assetType: 'Borrow',
          apyLabel: 'APR',
        }
      : {
          assetType: 'Collateral',
          apyLabel: 'APY',
        };

  return (
    <Box
      sx={{
        p: '0.75rem 1rem',
        backgroundColor: palette.secondary.dark,
        borderRadius: '0.5rem',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="smallDark">{labels.assetType} Asset</Typography>
        <Typography variant="smallDark">{labels.apyLabel} Change</Typography>
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mt={1}
      >
        <Stack direction="row" alignItems="center" justifyContent="flex-start">
          <CurrencyIcon currency={'ETH'} height={16} width={16} />
          <Typography variant="small">
            {formatAssetWithSymbol({
              amount: 0.01,
              symbol: 'ETH',
            })}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export default AssetMigrationChange;
