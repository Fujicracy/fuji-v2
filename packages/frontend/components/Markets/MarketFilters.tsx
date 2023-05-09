import { Box, Stack, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import React from 'react';

import { colorTheme } from '../../styles/theme';

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
      <Box
        sx={{
          position: 'relative',
        }}
      >
        <TextField
          label="Filter by token, protocol"
          type="text"
          variant="outlined"
          sx={{
            minWidth: '17.5rem',
            width: '17.5rem',
            '& .MuiInputBase-input': {
              p: '0.6rem 1rem 0.6rem 2.5rem',
              fontSize: '0.875rem',
              lineHeight: '1.5rem',
            },
            '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
              transform: 'translate(37px, 7px) scale(1)',
              fontSize: '0.875rem',
              lineHeight: '1.5rem',
              color: palette.info.dark,
            },
            '& .MuiFormLabel-root.Mui-focused': {
              color: `${palette.text.primary}`,
            },
            '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '1px !important',
              borderColor: `${colorTheme.palette.text.primary} !important`,
            },
          }}
          onChange={handleSearchChange}
          value={filters.searchQuery}
        />
        <Image
          src="/assets/images/shared/search.svg"
          alt="search icon"
          width={16}
          height={16}
          style={{
            position: 'absolute',
            left: '0.8rem',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />
      </Box>
    </Stack>
  );
}

export default MarketFiltersHeader;
