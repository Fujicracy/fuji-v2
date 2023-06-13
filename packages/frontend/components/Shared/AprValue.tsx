import { IconButton, Stack, Tooltip, useTheme } from '@mui/material';

import { AprData } from '../../helpers/markets';
import { DropletIcon } from './Icons';

type BorrowAprProps = AprData;

function AprValue({ base, reward, positive }: BorrowAprProps) {
  const { palette } = useTheme();
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="right"
      sx={{
        color: positive ? palette.success.main : palette.warning.main,
      }}
    >
      {reward !== undefined && reward > 0 && (
        <Tooltip
          title={`${base.toFixed(2)}% (base) - ${reward.toFixed(2)}% (reward)`}
          arrow
        >
          <IconButton>
            <DropletIcon />
          </IconButton>
        </Tooltip>
      )}
      {base.toFixed(2)}%
    </Stack>
  );
}

export default AprValue;

AprValue.defaultProps = {
  positive: false,
};
