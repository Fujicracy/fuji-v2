import { Grid } from '@mui/material';

import { formatValue } from '../../../../helpers/values';
import { AssetMeta, Position } from '../../../../store/models/Position';
import SummaryCardItem, { SummaryCardItemInfo } from './SummaryCardItem';

type SummaryProps = {
  collateral: AssetMeta;
  collateralInput: string;
  debt: AssetMeta;
  debtInput: string;
  futurePosition: Position | undefined;
  liquidationDiff: number;
  liquidationPrice: number;
  recommendedLtv: number;
  ltvMax: number;
  isMobile: boolean;
};
function Summary({
  collateral,
  collateralInput,
  debt,
  debtInput,
  futurePosition,
  liquidationDiff,
  liquidationPrice,
  recommendedLtv,
  isMobile,
  ltvMax,
}: SummaryProps) {
  const info: SummaryCardItemInfo[] = [
    {
      title: 'Collateral Provided',
      amount: `${formatValue(collateral.amount, {
        maximumFractionDigits: 3,
      })} ${collateral.token.symbol}`,
      footer: formatValue(collateral.amount * collateral.usdPrice, {
        style: 'currency',
      }),
      extra:
        futurePosition &&
        collateralInput !== '' &&
        parseFloat(collateralInput) !== 0
          ? formatValue(futurePosition.collateral.amount, {
              maximumFractionDigits: 3,
            })
          : undefined,
    },
    {
      title: 'Borrowed Value',
      amount: formatValue(debt.amount * debt.usdPrice, {
        style: 'currency',
      }),
      footer: `${formatValue(debt.amount, {
        maximumFractionDigits: 2,
      })} ${debt.token.symbol}`,
      extra:
        futurePosition && debtInput && parseFloat(debtInput) !== 0
          ? formatValue(futurePosition.debt.amount * debt.usdPrice, {
              style: 'currency',
            })
          : undefined,
    },
    {
      title: 'Liquidation Price',
      amount:
        liquidationDiff >= 0
          ? formatValue(liquidationPrice, { style: 'currency' })
          : '$0',
      footer:
        liquidationDiff >= 0
          ? `~${liquidationDiff.toFixed(0)}% below current price`
          : `n/a`,
      extra:
        futurePosition &&
        (Number(collateralInput) !== 0 || Number(debtInput) !== 0)
          ? formatValue(futurePosition.liquidationPrice, {
              style: 'currency',
            })
          : undefined,
      data: {
        amount: liquidationDiff,
        recommended: ltvMax - recommendedLtv,
      },
    },
    {
      title: 'Current Price',
      amount: formatValue(collateral.usdPrice, { style: 'currency' }),
      footer: collateral.token.symbol,
    },
  ];

  return (
    <SummaryContainer isMobile={isMobile}>
      {info.map((item, index) => (
        <SummaryCardItem key={index} info={item} isMobile={isMobile} />
      ))}
    </SummaryContainer>
  );
}

export default Summary;

type SummaryContainerProps = {
  children: React.ReactNode;
  isMobile: boolean;
};

function SummaryContainer({ children, isMobile }: SummaryContainerProps) {
  return isMobile ? (
    <Grid container direction="column" rowSpacing="0.75rem">
      {children}
    </Grid>
  ) : (
    <Grid container columnSpacing="1rem">
      {children}
    </Grid>
  );
}
