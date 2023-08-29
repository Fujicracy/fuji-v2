import { Box, MenuItem, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React from 'react';

type NavigationItemProps = {
  label: string;
  isActive?: boolean;
  type?: string;
  onClick?: () => void;
};

function NavigationItem({
  label,
  type,
  onClick,
  isActive = false,
}: NavigationItemProps) {
  const { palette } = useTheme();

  return (
    <>
      <MenuItem
        onClick={onClick}
        sx={{
          lineHeight: '160%',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: isActive ? palette.text.primary : palette.info.main,
          background: isActive ? alpha('#25262A', 0.7) : 'transparent',
          p: '0.375rem 1rem',
          borderRadius: '10px',
          '&:hover': {
            color: palette.text.primary,
            background: alpha('#25262A', 0.7),
          },
        }}
      >
        {label}
      </MenuItem>
      {type && (
        <Box
          sx={{
            p: '2px 0.5rem',
            borderRadius: '100px',
            background: '#54F5FF1A',
            height: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ml: -1,
          }}
        >
          <Typography
            variant="small"
            color="#54F5FF"
            lineHeight={1.5}
            fontWeight={500}
          >
            {type.toUpperCase()}
          </Typography>
        </Box>
      )}
    </>
  );
}

export default NavigationItem;
