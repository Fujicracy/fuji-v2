import { Card, CardContent, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { maxBorrowLimit, recommendedLTV } from '../../../helpers/assets';
import { PositionData } from '../../../helpers/positions';
import { useBorrow } from '../../../store/borrow.store';
import { BorrowingPosition } from '../../../store/models/Position';
import Container from './Container';
import Details from './Details';
import LTVProgressBar from './LTVProgressBar';
import Summary from './Summary/Summary';

type OverviewProps = {
  isEditing: boolean;
  positionData: PositionData;
};

function Overview({ positionData, isEditing }: OverviewProps) {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('md'));

  const { position, editedPosition } = positionData;
  const {
    collateral,
    debt,
    ltv,
    ltvMax,
    ltvThreshold,
    liquidationDiff,
    liquidationPrice,
  } = position as BorrowingPosition;

  const vault = useBorrow((state) => state.activeVault);
  const allProviders = useBorrow((state) => state.allProviders);
  const activeProvider = useBorrow((state) => state.activeProvider);

  const collateralInput = useBorrow((state) => state.collateral.input);
  const debtInput = useBorrow((state) => state.debt?.input);

  const dynamicLtv = editedPosition
    ? (editedPosition as BorrowingPosition).ltv
    : ltv;
  const recommendedLtv = recommendedLTV(ltvMax);

  const borrowLimit = maxBorrowLimit(
    editedPosition ? editedPosition.collateral.amount : Number(collateralInput),
    collateral.usdPrice,
    ltvMax
  );

  if (debtInput === undefined) return <></>;
  return (
    <Container isMobile={isMobile}>
      {!isMobile && <Typography variant="body2">Position Overview</Typography>}
      <Card
        sx={{
          flexDirection: 'column',
          alignItems: 'center',
          p: '1.5rem',
          width: '100%',
          mt: !isMobile ? '1rem' : '0',
        }}
      >
        <CardContent sx={{ padding: 0, gap: '1rem', width: '100%' }}>
          <Summary
            collateral={collateral}
            collateralInput={collateralInput}
            debt={debt}
            debtInput={debtInput}
            editedPosition={editedPosition}
            liquidationDiff={liquidationDiff}
            liquidationPrice={liquidationPrice}
            recommendedLtv={recommendedLtv}
            ltvMax={ltvMax}
            isMobile={isMobile}
          />

          <LTVProgressBar
            borrowLimit={borrowLimit}
            value={dynamicLtv > ltvMax ? ltvMax : dynamicLtv}
            maxLTV={ltvMax}
            recommendedLTV={recommendedLtv}
            isMobile={isMobile}
          />

          <Details
            ltv={ltv}
            ltvThreshold={ltvThreshold}
            providers={allProviders}
            activeProvider={activeProvider}
            vault={vault}
            isMobile={isMobile}
            isEditing={isEditing}
          />
        </CardContent>
      </Card>
    </Container>
  );
}

export default Overview;
