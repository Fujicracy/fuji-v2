import { Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';

import { AprType } from '../../helpers/assets';
import { TooltipWrapper } from './Tooltips';

type BestLabelProps = {
  aprType: AprType;
};

function BestLabel({ aprType }: BestLabelProps) {
  const { palette } = useTheme();
  return (
    <TooltipWrapper
      title={
        aprType === AprType.BORROW ? 'Lowest borrow APR' : 'Highest supply APY'
      }
      placement="top"
    >
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

BestLabel.defaultProps = {
  aprType: AprType.BORROW,
};
