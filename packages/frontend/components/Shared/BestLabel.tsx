import { Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';

import { TooltipWrapper } from './Tooltips';

function BestLabel() {
  const { palette } = useTheme();
  return (
    <TooltipWrapper title="Lowest borrow APR" placement="top">
      <Stack
        data-cy="best-label"
        direction="row"
        alignItems="center"
        gap="0.25rem"
        sx={{
          backgroundColor: alpha(palette.success.main, 0.2),
          p: '0.2rem 0.6rem 0.2rem 0.5rem',
          borderRadius: '100px',
        }}
      >
        <Image
          src="/assets/images/shared/lightning.png"
          height={14}
          width={12}
          alt="Lightning logo"
        />
        <Typography
          variant="xsmall"
          color={palette.success.main}
          fontWeight={500}
        >
          Best
        </Typography>
      </Stack>
    </TooltipWrapper>
  );
}

export default BestLabel;
