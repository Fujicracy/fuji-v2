import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

type TabChipProps = {
  selected: boolean;
  label: string;
  onClick: () => void;
  size: 'large' | 'default';
};

function TabChip({ selected, label, onClick, size }: TabChipProps) {
  const { palette } = useTheme();

  return (
    <Box
      sx={{
        cursor: 'pointer',
        flex: 1,
        backgroundColor: selected ? '#35353B' : 'transparent',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={() => {
        onClick();
      }}
    >
      <Typography
        color={palette.text.primary}
        fontSize={size === 'large' ? '1rem' : '0.875rem'}
        lineHeight="160%"
      >
        {label}
      </Typography>
    </Box>
  );
}

export default TabChip;

TabChip.defaultProps = {
  sx: undefined,
};
