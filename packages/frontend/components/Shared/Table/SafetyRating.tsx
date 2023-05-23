import { Chip } from '@mui/material';
import React from 'react';

import { ratingToNote } from '../../../helpers/ratings';

function SafetyRating({ rating }: { rating: number }) {
  return (
    <Chip
      variant={rating > 75 ? 'success' : 'warning'}
      label={ratingToNote(rating)}
      sx={{ '& .MuiChip-label': { p: '0.25rem 0.5rem' } }}
    />
  );
}

export default SafetyRating;
