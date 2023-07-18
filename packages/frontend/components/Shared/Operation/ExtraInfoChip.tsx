import { Chip } from '@mui/material';
import React from 'react';

import { formatValue } from '../../../helpers/values';

type ExtraInfoChipProps = {
  amount: string | number;
  extra?: string | number;
};

function ExtraInfoChip({ amount, extra }: ExtraInfoChipProps) {
  if (!extra || extra === amount) return null;
  return (
    <Chip
      sx={{ marginLeft: '0.5rem' }}
      label={`${formatValue(extra, {
        maximumFractionDigits: 3,
      })} after`}
      variant={'currency'}
    />
  );
}

export default ExtraInfoChip;
