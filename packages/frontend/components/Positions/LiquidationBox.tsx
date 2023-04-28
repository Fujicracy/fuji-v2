import { Stack, TableCell, Typography, useTheme } from '@mui/material';

import { liquidationColor } from '../../helpers/positions';
import { formatValue } from '../../helpers/values';

type LiquidationBoxProps = {
  liquidationPrice: number | '-';
  percentPriceDiff: number | '-';
  ltv: number;
  recommendedLtv: number;
};
function LiquidationBox({
  liquidationPrice,
  percentPriceDiff,
  ltv,
  recommendedLtv,
}: LiquidationBoxProps) {
  const { palette } = useTheme();
  const displayPercent = () => {
    if (liquidationPrice === 0 || liquidationPrice === '-') {
      return <span>No debt</span>;
    } else {
      return (
        <Typography
          variant="xsmall"
          color={liquidationColor(ltv, recommendedLtv, palette)}
        >
          (~{percentPriceDiff}%{' below)'}
        </Typography>
      );
    }
  };
  return (
    <TableCell>
      <Stack direction="row" justifyContent="right" alignItems="center" gap={1}>
        <Typography variant="small">
          {formatValue(liquidationPrice, {
            style: 'currency',
            minimumFractionDigits: 0,
          })}
        </Typography>
        {displayPercent()}
      </Stack>
    </TableCell>
  );
}

export default LiquidationBox;
