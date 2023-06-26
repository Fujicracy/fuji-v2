import { Container, Grid, Stack, Typography, useTheme } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { PATH } from '../../constants';
import { BasePosition, viewDynamicPosition } from '../../helpers/positions';
import { useBorrow } from '../../store/borrow.store';
import { FormType } from '../../store/shared/state';
import InfoBlock from '../Shared/Analytics/InfoBlock';
import LendingDetails from './LendingDetails';
import LendingForm from './LendingForm';

function Lending() {
  const { palette } = useTheme();
  const router = useRouter();
  const formType = useBorrow((state) => state.formType);
  const [loading, setLoading] = useState<boolean>(false);

  const isEditing = formType === FormType.Edit;

  const [basePosition, setBasePosition] = useState<BasePosition | undefined>(
    viewDynamicPosition(isEditing, false)
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
        <Grid item xs={12} md={7.5} order={{ xs: 2, md: 1 }}>
          <LendingDetails />
        </Grid>
        <Grid item xs={12} md={4.5} order={{ xs: 1, md: 2 }}>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6}>
              <InfoBlock
                label="My Deposits"
                value={'0'}
                loading={loading}
                contrast
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InfoBlock
                label="Rewards"
                value={'0'}
                loading={loading}
                contrast
              />
            </Grid>
          </Grid>
          <LendingForm isEditing={false} basePosition={basePosition} />
        </Grid>
      </Grid>
    </Container>
  );
}

export default Lending;
