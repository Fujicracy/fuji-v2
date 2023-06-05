import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import { BasePosition } from '../../../helpers/positions';
import { useBorrow } from '../../../store/borrow.store';
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

  const providers = useBorrow((state) => state.allProviders);
  const vault = useBorrow((state) => state.activeVault);

  return (
    <Container isMobile={isMobile}>
      {!isMobile && <Title providers={providers} vault={vault} />}

      <OverviewTab isEditing={isEditing} basePosition={basePosition} />
    </Container>
  );
}

export default Overview;
