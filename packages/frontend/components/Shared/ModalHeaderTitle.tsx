import { Box, Typography } from '@mui/material';
import React from 'react';

function ModalHeaderTitle({ title }: { title: string }) {
  return (
    <Box mb="2rem" sx={{ textAlign: { xs: 'left', sm: 'center' } }}>
      <Typography variant="h6" fontWeight={500}>
        {title}
      </Typography>
    </Box>
  );
}

export default ModalHeaderTitle;
