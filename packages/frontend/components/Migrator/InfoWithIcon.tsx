import { Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

function InfoWithIcon({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <Stack
      p="0.615rem 0.75rem"
      direction="row"
      alignItems="center"
      justifyContent="left"
      gap={1}
      sx={{ backgroundColor: '#27272E', width: '100%', borderRadius: '0.5rem' }}
    >
      {icon}
      <Typography variant="small">{text}</Typography>
    </Stack>
  );
}

export default InfoWithIcon;
