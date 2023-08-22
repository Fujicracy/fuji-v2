import { Box, Checkbox, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { ChangeEvent, useState } from 'react';

function RepayDebtCheckBox() {
  const { palette } = useTheme();
  const [checked, setChecked] = useState(false);

  return (
    <Box
      sx={{
        p: '0.75rem 1rem',
        backgroundColor: palette.secondary.dark,
        borderRadius: '0.5rem',
      }}
    >
      <Stack direction="row" alignItems="flex-start">
        <Checkbox
          data-cy={`migrate-repay-debt`}
          checked={checked}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setChecked(event.target.checked);
          }}
          color="default"
          sx={{ p: '0', mr: '0.5rem' }}
        />
        <Typography variant="small">
          Repay your debt on the source chain and take on new debt in USDC or
          ETH on the destination chain
        </Typography>
      </Stack>
    </Box>
  );
}

export default RepayDebtCheckBox;
