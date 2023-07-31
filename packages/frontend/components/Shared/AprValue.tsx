import { IconButton, Stack, Tooltip, useTheme } from '@mui/material';

import { AprType } from '../../helpers/assets';
import { AprData } from '../../helpers/markets';
import { DropletIcon } from './Icons';
import { TooltipWrapper } from './Tooltips';

type AprProps = Omit<AprData, 'assetType'> & {
  aprType: AprType;
  justify?: 'left' | 'center' | 'right';
};

function AprValue({
  base,
  reward,
  positive,
  aprType,
  providerName,
  justify = 'right',
}: AprProps) {
  const { palette } = useTheme();

  const isHiddenReward = providerName
    ?.toLowerCase()
    ?.split(' ')
    ?.some((word) => ['dforce'].includes(word));

  const actualReward = reward ? Math.abs(reward) : 0;
  const result = Math.abs(
    aprType === AprType.BORROW ? base - actualReward : base + actualReward
  );

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent={justify}
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
      {isHiddenReward && !reward ? (
        <TooltipWrapper
          title={
            'There are rewards for this vault that are not displayed here but are taken into account.'
          }
          placement={'top'}
        >
          <>{result.toFixed(2)}%</>
        </TooltipWrapper>
      ) : (
        <>{result.toFixed(2)}%</>
      )}
    </Stack>
  );
}

export default AprValue;

AprValue.defaultProps = {
  positive: false,
};
