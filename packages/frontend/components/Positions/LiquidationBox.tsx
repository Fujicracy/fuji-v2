import { Box, TableCell, Typography, useTheme } from '@mui/material';

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
        <span>
          <Typography
            variant="small"
            color={liquidationColor(ltv, recommendedLtv, palette)}
          >
            ~{percentPriceDiff}%{' '}
          </Typography>
          <Typography variant="small" color={palette.info.main}>
            below
          </Typography>
        </span>
      );
    }
  };
  return (
    <TableCell align="right">
      <Box pt={1} pb={1}>
        <Typography variant="small">
          {formatValue(liquidationPrice, {
            style: 'currency',
            minimumFractionDigits: 0,
          })}
        </Typography>
        <br />
        {displayPercent()}
      </Box>
    </TableCell>
  );
}

export default LiquidationBox;
