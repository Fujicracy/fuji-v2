import { IconButton, Stack, Tooltip, useTheme } from '@mui/material';

import { AssetType } from '../../helpers/assets';
import { AprData } from '../../helpers/markets';
import { DropletIcon } from './Icons';
import { TooltipWrapper } from './Tooltips';

type BorrowAprProps = AprData & { justify?: 'left' | 'center' | 'right' };

function AprValue({
  base,
  reward,
  positive,
  assetType,
  providerName,
  justify = 'right',
}: BorrowAprProps) {
  const { palette } = useTheme();

  const isHiddenReward = providerName
    ?.toLowerCase()
    ?.split(' ')
    ?.some((word) => ['compound', 'dforce'].includes(word));

  const diff =
    (Number(reward) || 0) * (assetType === AssetType.Collateral ? 1 : -1);
  const resultAPR = Math.abs(base - diff);

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
          <>{resultAPR.toFixed(2)}%</>
        </TooltipWrapper>
      ) : (
        <>{resultAPR.toFixed(2)}%</>
      )}
    </Stack>
  );
}

export default AprValue;

AprValue.defaultProps = {
  type: AssetType.Collateral,
  positive: false,
};
