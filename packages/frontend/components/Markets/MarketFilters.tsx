import { Stack, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

export type MarketFilters = {
  searchQuery: string;
  chain: string;
};

function MarketFiltersHeader({
  filters,
  setFilters,
}: {
  filters: MarketFilters;
  setFilters: (filters: MarketFilters) => void;
}) {
  const { palette } = useTheme();

  const handleSearchChange = (event: React.FocusEvent<HTMLInputElement>) => {
    const enteredValue = event?.target?.value.trim();

    setFilters({ ...filters, searchQuery: enteredValue });
  };

  return (
    <Stack>
      <TextField
        label="Custom %"
        type="text"
        variant="outlined"
        sx={{
          minWidth: '17.5rem',
          width: '17.5rem',
          '& > legend': {
            fontSize: '0.875rem',
            color: palette.info.dark,
          },
          '& .MuiInputBase-input': {
            p: '0.6rem 1rem',
          },
          '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
            transform: 'translate(13px, 10px) scale(1)',
          },
          '& .MuiFormLabel-root.Mui-focused': {
            color: `${palette.text.primary}`,
          },
          '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
        }}
        onChange={handleSearchChange}
        value={filters.searchQuery}
      />
    </Stack>
  );
}

export default MarketFiltersHeader;
