import { Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ReactNode } from 'react';

function InfoRow({ title, value }: { title: string; value: ReactNode }) {
  const { palette } = useTheme();

  return (
    <Stack
      width="100%"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      mt="0.6rem"
      flexWrap="wrap"
    >
      <Typography
        sx={{
          ['@media screen and (max-width: 370px)']: {
            fontSize: '0.7rem',
          },
        }}
        color={palette.info.main}
        variant="small"
      >
        {title}
      </Typography>

      {value}
    </Stack>
  );
}

export default InfoRow;
