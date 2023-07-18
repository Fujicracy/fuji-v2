import { Grid } from '@mui/material';
import { VaultType } from '@x-fuji/sdk';

import { formatAssetWithSymbol, formatValue } from '../../../../helpers/values';
import { AssetMeta, Position } from '../../../../store/models/Position';
import SummaryCardItem, { SummaryCardItemInfo } from './SummaryCardItem';

type SummaryProps = {
  collateral: AssetMeta;
  collateralInput: string;
  debt: AssetMeta;
  debtInput: string;
  editedPosition: Position | undefined;
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
  editedPosition,
  liquidationDiff,
  liquidationPrice,
  recommendedLtv,
  isMobile,
  ltvMax,
}: SummaryProps) {
  const info: SummaryCardItemInfo[] = [
    {
      title: 'Collateral Provided',
      amount: formatAssetWithSymbol({
        amount: collateral.amount,
        symbol: collateral.currency.wrapped.symbol,
        maximumFractionDigits: 3,
        minimumFractionDigits: 2,
      }),
      footer: formatValue(collateral.amount * collateral.usdPrice, {
        style: 'currency',
      }),
      extra:
        editedPosition &&
        collateralInput !== '' &&
        parseFloat(collateralInput) !== 0
          ? formatValue(editedPosition.collateral.amount, {
              maximumFractionDigits: 3,
            })
          : undefined,
    },
    {
      title: 'Borrowed Value',
      amount: formatValue(debt.amount * debt.usdPrice, {
        style: 'currency',
      }),
      footer: formatAssetWithSymbol({
        amount: debt.amount,
        symbol: debt.currency.symbol,
      }),
      extra:
        editedPosition?.type === VaultType.BORROW &&
        debtInput &&
        parseFloat(debtInput) !== 0
          ? formatValue(editedPosition.debt.amount * debt.usdPrice, {
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
        editedPosition?.type === VaultType.BORROW &&
        (Number(collateralInput) !== 0 || Number(debtInput) !== 0)
          ? formatValue(editedPosition.liquidationPrice, {
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
      footer: collateral.currency.symbol,
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
