import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { ReactNode } from 'react';

type InfoBlockProps = {
  label: string;
  value: ReactNode;
  tooltip?: string;
};

function InfoBlock({ label, value, tooltip }: InfoBlockProps) {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  return (
    <Box
      sx={{
        p: '0.75rem 1rem',
        backgroundColor: alpha('#FFFFFF', 0.03),
        borderRadius: '0.5rem',
      }}
    >
      <Stack flexDirection="row" alignItems="center">
        <Typography variant="smallDark" fontSize="0.75rem">
          {label}
        </Typography>
        {tooltip && !isMobile && (
          <Tooltip title={tooltip} placement="top">
            <InfoOutlinedIcon
              sx={{
                ml: '0.313rem',
                fontSize: '0.875rem',
                display: { xs: 'none', sm: 'inline' },
                cursor: 'pointer',
              }}
            />
          </Tooltip>
        )}
      </Stack>
      <Typography
        fontSize="1rem"
        lineHeight="160%"
        fontWeight={400}
        mt="0.5rem"
      >
        {value}
      </Typography>
    </Box>
  );
}

export default InfoBlock;
