import { Stack, Typography } from '@mui/material';

function BetaBanner() {
  return (
    <Stack
      p="0.475rem 4.5rem 0.475rem 1rem"
      alignItems="center"
      position="relative"
    >
      <Typography variant="xsmall">
        {
          'We are in beta, some bugs may arise. We appreciate your feedback as we work diligently to improve the dApp user experience.'
        }
      </Typography>
      <Typography
        variant="xsmall"
        sx={{
          position: 'absolute',
          top: '0.475rem',
          right: '1rem',
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
      >
        Dismiss
      </Typography>
    </Stack>
  );
}

export default BetaBanner;
