import { Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { AssetType } from '../../helpers/assets';

type APRChangeProps = {
  type: AssetType;
  start: number;
  end: number;
};

function APRChange({ type, start, end }: APRChangeProps) {
  const { palette } = useTheme();

  const color =
    type === AssetType.Debt ? palette.warning.main : palette.success.main;

  return (
    <Stack direction="row" alignItems="center" justifyContent="flex-end">
      <Typography variant="small" color={color}>
        {start}%
      </Typography>
      <img
        src="/assets/images/shared/arrowRight.svg"
        alt="Arrow Right"
        width={14}
        height={10}
        style={{ marginLeft: '0.25rem', marginTop: '-2px' }}
      />
      <Typography variant="small" ml={0.5} color={color}>
        {end}%
      </Typography>
    </Stack>
  );
}

export default APRChange;
