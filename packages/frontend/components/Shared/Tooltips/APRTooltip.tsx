import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Tooltip, useTheme } from '@mui/material';
import React from 'react';

function APRTooltip() {
  const { palette } = useTheme();

  return (
    <Tooltip
      arrow
      title="APR, or annual percentage rate, represents the price you pay to borrow money."
    >
      <InfoOutlinedIcon
        sx={{
          ml: '0.4rem',
          fontSize: '0.875rem',
          color: palette.info.dark,
          display: { xs: 'none', sm: 'inline' },
        }}
      />
    </Tooltip>
  );
}

export default APRTooltip;
