import { Chip } from '@mui/material';
import React from 'react';

function ExtraInfoChip({ text }: { text?: string | number }) {
  if (!text) return null;
  return (
    <Chip sx={{ marginLeft: '0.5rem' }} label={text} variant={'currency'} />
  );
}

export default ExtraInfoChip;
