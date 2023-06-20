import { Box, Card, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

function VaultStrategy() {
  const { palette } = useTheme();

  return (
    <>
      <Typography variant="body2" mt={6}>
        Vault Strategy
      </Typography>
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: '0',
          mt: '1rem',
        }}
      >
        <img
          src={'/assets/images/onboarding/onboarding_1.svg'}
          alt="Vault strategy Image"
          style={{ width: '100%', height: 'auto' }}
        />
        <Stack p="1.5rem">
          <Typography variant="body2">
            Automatic interest rates optimization
          </Typography>
          <Typography variant="body">
            {
              'Users who are "lenders only" that have deposited funds into a vault. The vault aim to maximise the returns on their assets by seeking the highest yields available from a aggregated list of lending protocols.'
            }
          </Typography>
          <Box
            sx={{
              p: '0.75rem 1rem',
              backgroundColor: palette.secondary.main,
              mt: 2,
              borderRadius: '6px',
            }}
          >
            {
              "💡️ It's important to note that each vault aggregates its own set of lending/borrowing protocols. The protocols illustrated above may vary from one vault to another."
            }
          </Box>
        </Stack>
      </Card>
    </>
  );
}

export default VaultStrategy;
