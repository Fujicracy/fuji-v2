import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

import { borrowLimit, recommendedLTV } from '../../../helpers/assets';
import { BasePosition } from '../../../helpers/positions';
import { useBorrow } from '../../../store/borrow.store';
import APYChart from '../Analytics/APYChart';
import Container from './Container';
import Details from './Details';
import LTVProgressBar from './LTVProgressBar';
import Summary from './Summary/Summary';
import Title from './Title';

type OverviewProps = {
  isEditing: boolean;
  basePosition: BasePosition;
};

function Overview({ basePosition, isEditing }: OverviewProps) {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));
  const [selectedTab, setSelectedTab] = useState<number>(0);

  const { position, editedPosition } = basePosition;
  const {
    collateral,
    debt,
    ltv,
    ltvMax,
    ltvThreshold,
    liquidationDiff,
    liquidationPrice,
  } = position;

  const allProviders = useBorrow((state) => state.allProviders);
  const vault = useBorrow((state) => state.activeVault);
  const providers =
    allProviders && vault ? allProviders[vault.address.value] : [];
  const mode = useBorrow((state) => state.mode);

  const collateralInput = useBorrow((state) => state.collateral.input);
  const debtInput = useBorrow((state) => state.debt.input);

  const dynamicLtv = editedPosition ? editedPosition.ltv : ltv;
  const recommendedLtv = recommendedLTV(ltvMax);

  const limit = borrowLimit(
    mode,
    editedPosition ? editedPosition.collateral.amount : 0,
    Number(collateralInput),
    collateral.usdPrice,
    ltvMax
  );

  return (
    <Container isMobile={isMobile}>
      {!isMobile && (
        <Title
          providers={providers}
          vault={vault}
          selectedTab={selectedTab}
          onTabClick={setSelectedTab}
        />
      )}

      <APYChart />

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
        borrowLimit={limit}
        value={dynamicLtv > ltvMax ? ltvMax : dynamicLtv}
        maxLTV={ltvMax}
        recommendedLTV={recommendedLtv}
        isMobile={isMobile}
      />

      <Details
        ltv={ltv}
        ltvThreshold={ltvThreshold}
        providers={providers}
        vault={vault}
        isMobile={isMobile}
        isEditing={isEditing}
      />
    </Container>
  );
}

export default Overview;
