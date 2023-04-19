import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

import { BasePosition } from '../../../helpers/positions';
import { useBorrow } from '../../../store/borrow.store';
import AnalyticsTab from './AnalyticsTab';
import Container from './Container';
import OverviewTab from './OverviewTab';
import Title from './Title';

type OverviewProps = {
  isEditing: boolean;
  basePosition: BasePosition;
};

function Overview({ basePosition, isEditing }: OverviewProps) {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));
  const [selectedTab, setSelectedTab] = useState<number>(0);

  const allProviders = useBorrow((state) => state.allProviders);
  const vault = useBorrow((state) => state.activeVault);
  const providers =
    allProviders && vault ? allProviders[vault.address.value] : [];

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

      {selectedTab === 0 ? (
        <OverviewTab isEditing={isEditing} basePosition={basePosition} />
      ) : (
        <AnalyticsTab />
      )}
    </Container>
  );
}

export default Overview;
