import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { borrowLimit, recommendedLTV } from '../../../helpers/assets';
import { BasePosition } from '../../../helpers/positions';
import { useBorrow } from '../../../store/borrow.store';
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

  const { position, futurePosition } = basePosition;
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

  const collateralInput = useBorrow((state) => state.collateral.input);
  const debtInput = useBorrow((state) => state.debt.input);

  const dynamicLtv = futurePosition ? futurePosition.ltv : ltv;

  return (
    <Container isMobile={isMobile}>
      {!isMobile && <Title providers={providers} vault={vault} />}

      <Summary
        collateral={collateral}
        collateralInput={collateralInput}
        debt={debt}
        debtInput={debtInput}
        futurePosition={futurePosition}
        liquidationDiff={liquidationDiff}
        liquidationPrice={liquidationPrice}
        isMobile={isMobile}
      />

      <LTVProgressBar
        borrowLimit={borrowLimit(
          futurePosition
            ? futurePosition.collateral.amount
            : collateralInput
            ? parseFloat(collateralInput)
            : 0,
          collateral.usdPrice,
          dynamicLtv
        )}
        value={dynamicLtv > ltvMax ? ltvMax : dynamicLtv}
        maxLTV={ltvMax}
        recommendedLTV={recommendedLTV(ltvMax)}
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
