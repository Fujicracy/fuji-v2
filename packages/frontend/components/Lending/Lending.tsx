import { Container, Grid, Stack, Typography, useTheme } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { PATH } from '../../constants';
import {
  PositionData,
  viewDynamicLendingPosition,
} from '../../helpers/positions';
import { useLend } from '../../store/lend.store';
import { FormType } from '../../store/types/state';
import InfoBlock from '../Shared/Analytics/InfoBlock';
import LendingDetails from './LendingDetails';
import LendingForm from './LendingForm';

function Lending() {
  const { palette } = useTheme();
  const router = useRouter();
  const formType = useLend((state) => state.formType);
  const [loading, setLoading] = useState<boolean>(false);

  const isEditing = formType === FormType.Edit;

  const [positionData, setPositionData] = useState<PositionData | undefined>(
    viewDynamicLendingPosition(isEditing)
  );

  return (
    <Container>
      <Stack
        flexDirection="row"
        alignItems="center"
        onClick={() =>
          router.push({
            pathname: isEditing ? PATH.MY_POSITIONS : PATH.MARKETS,
            query: { tab: 1 },
          })
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
          Back to All Lending {isEditing ? 'Positions' : 'Vaults'}
        </Typography>
      </Stack>

      <Grid container wrap="wrap" alignItems="flex-start" spacing={3}>
        <Grid item xs={12} md={7.5} order={{ xs: 2, md: 1 }}>
          <LendingDetails isEditing={isEditing} />
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
          <LendingForm isEditing={isEditing} positionData={positionData} />
        </Grid>
      </Grid>
    </Container>
  );
}

export default Lending;
