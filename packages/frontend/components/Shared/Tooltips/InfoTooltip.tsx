import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Tooltip, useTheme } from '@mui/material';
import React from 'react';

function InfoTooltip({
  title,
  isLeft = false,
  isDark = false,
}: {
  title: string;
  isLeft?: boolean;
  isDark?: boolean;
}) {
  const { palette } = useTheme();
  const margin = isLeft ? { mr: '0.315rem' } : { ml: '0.315rem' };

  return (
    <Tooltip arrow placement="top" title={title}>
      <InfoOutlinedIcon
        sx={{
          ...margin,
          fontSize: '1rem',
          color: isDark ? palette.info.dark : palette.info.main,
          display: { xs: 'none', sm: 'inline' },
        }}
      />
    </Tooltip>
  );
}

export default InfoTooltip;
