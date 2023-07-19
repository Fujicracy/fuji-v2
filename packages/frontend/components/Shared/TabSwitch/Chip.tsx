import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

type TabChipProps = {
  selected: boolean;
  label: string;
  onClick: () => void;
  size: 'large' | 'default';
};

function Chip({ selected, label, onClick, size }: TabChipProps) {
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
        lineHeight="100%"
        textAlign="center"
        sx={{
          ['@media screen and (max-width: 980px)']: {
            fontSize: '0.8rem',
          },
          ['@media screen and (max-width: 390px)']: {
            fontSize: '0.7rem',
          },
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default Chip;

Chip.defaultProps = {
  sx: undefined,
};
