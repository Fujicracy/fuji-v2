import { Chip } from '@mui/material';
import React from 'react';

import { formatValue } from '../../../helpers/values';

type ExtraInfoChipProps = {
  amount: string | number;
  extra?: string | number;
};

function ExtraInfoChip({ amount, extra }: ExtraInfoChipProps) {
  if (!extra || extra === amount) return null;
  const value = formatValue(extra, {
    maximumFractionDigits: 3,
  });
  console.warn(value);
  return (
    <Chip
      sx={{ marginLeft: '0.5rem' }}
      label={`${value === '-0' ? '0' : value} after`}
      variant={'currency'}
    />
  );
}

export default ExtraInfoChip;
