import { Container, Grid, Stack, Typography, useTheme } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { PATH } from '../../constants';
import { BasePosition, viewDynamicPosition } from '../../helpers/positions';
import { useBorrow } from '../../store/borrow.store';
import LendingDetails from '../Lending/LendingDetails';
import LendingForm from '../Lending/LendingForm';

function Lending() {
  const { palette } = useTheme();
  const router = useRouter();
  const formType = useBorrow((state) => state.formType);

  const isEditing = formType !== 'create';

  const [basePosition, setBasePosition] = useState<BasePosition>(
    viewDynamicPosition(false, undefined)
  );

  return (
    <Container>
      <Stack
        flexDirection="row"
        alignItems="center"
        onClick={() =>
          router.push({ pathname: PATH.MARKETS, query: { tab: 1 } })
        }
        sx={{
          cursor: 'pointer',
          mt: { xs: '0', sm: '-2.5rem' },
          mb: '1rem',
        }}
      >
        <Image
          src="/assets/images/shared/arrowBack.svg"
          height={14}
          width={16}
          alt="Arrow Back"
        />
        <Typography variant="small" ml="0.75rem" color={palette.info.main}>
          Back to All Lending Vaults
        </Typography>
      </Stack>

      <Grid container wrap="wrap" alignItems="flex-start" spacing={3}>
        <Grid item xs={12} lg={7.5}>
          <LendingDetails />
        </Grid>
        <Grid item sm={12} lg={4.5}>
          <LendingForm isEditing={isEditing} basePosition={basePosition} />
        </Grid>
      </Grid>
    </Container>
  );
}

export default Lending;
