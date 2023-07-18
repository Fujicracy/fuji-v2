import { Container, Grid } from '@mui/material';
import { VaultType } from '@x-fuji/sdk';
import React from 'react';

import { PositionData } from '../../helpers/positions';
import { useLend } from '../../store/lend.store';
import { FormType } from '../../store/types/state';
import BackToList from '../Shared/BackToList';
import LendingForm from './Form';
import LendingDetails from './LendingDetails';

type LendingProps = {
  positionData?: PositionData;
};

function Lending({ positionData }: LendingProps) {
  const formType = useLend((state) => state.formType);
  const isEditing = formType === FormType.Edit;
  console.warn(isEditing);
  return (
    <Container>
      <BackToList type={VaultType.LEND} isEditing={isEditing} />

      <Grid container wrap="wrap" alignItems="flex-start" spacing={3}>
        <Grid item xs={12} md={7.5} order={{ xs: 2, md: 1 }}>
          <LendingDetails isEditing={isEditing} positionData={positionData} />
        </Grid>
        <Grid
          item
          xs={12}
          md={4.5}
          order={{ xs: 1, md: 2 }}
          mt={{ xs: 0, md: !isEditing ? '2.6rem' : 0 }}
        >
          <LendingForm isEditing={isEditing} positionData={positionData} />
        </Grid>
      </Grid>
    </Container>
  );
}

export default Lending;
