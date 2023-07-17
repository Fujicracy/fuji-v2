import { Box, Container, Divider } from '@mui/material';
import Head from 'next/head';
import { useEffect, useState } from 'react';

import {
  PositionData,
  viewDynamicLendingPosition,
  viewEditedLendingPosition,
} from '../../helpers/positions';
import { useAuth } from '../../store/auth.store';
import { useLend } from '../../store/lend.store';
import { LendingPosition, Position } from '../../store/models/Position';
import { useNavigation } from '../../store/navigation.store';
import { usePositions } from '../../store/positions.store';
import { FormType } from '../../store/types/state';
import Footer from '../App/Footer';
import Lending from './Lending';

type LendingWrapperProps = {
  formType: FormType;
  query?: {
    address: string;
    chain: string;
  };
};

function LendingWrapper({ formType, query }: LendingWrapperProps) {
  const address = useAuth((state) => state.address);
  const positions = usePositions((state) => state.lendingPositions);
  const baseCollateral = useLend((state) => state.collateral);
  const mode = useLend((state) => state.mode);
  const willLoadLend = useNavigation((state) => state.lendPage.willLoad);
  const isEditing = formType === FormType.Edit;

  const [positionData, setPositionData] = useState<PositionData | undefined>(
    undefined
  );
  const [loading, setLoading] = useState<boolean>(
    isEditing && (!positions || positions.length === 0)
  );

  useEffect(() => {
    let matchPosition: LendingPosition | undefined;
    let editedPosition: Position | undefined;

    if (address && positions.length > 0 && query) {
      matchPosition = (positions as LendingPosition[]).find(
        (position) =>
          position.vault?.address.value === query.address &&
          position.vault?.chainId.toString() === query.chain
      );

      editedPosition = matchPosition
        ? viewEditedLendingPosition(baseCollateral, matchPosition, mode)
        : undefined;
    }

    if (willLoadLend) return;

    const newPositionData = viewDynamicLendingPosition(
      isEditing,
      matchPosition,
      editedPosition as LendingPosition
    );

    setPositionData(newPositionData);
  }, [
    formType,
    baseCollateral,
    address,
    positions,
    mode,
    isEditing,
    willLoadLend,
    query,
  ]);

  return (
    <>
      <Head>
        <title>{`${isEditing ? 'Position' : 'Lend'} - Fuji V2 Himalaya`}</title>
        <meta name="description" content="Lend assets and earn interest" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Divider
        sx={{
          display: { xs: 'block', sm: 'none' },
          mb: '1rem',
        }}
      />

      <Container
        sx={{
          mt: { xs: '0', sm: '4rem' },
          mb: { xs: '7rem', sm: '0' },
          pl: { xs: '0.25rem', sm: '1rem' },
          pr: { xs: '0.25rem', sm: '1rem' },
          minHeight: '75vh',
        }}
      >
        <Box sx={{ height: '45rem', width: '100%' }}>
          <Lending positionData={positionData} />
        </Box>
      </Container>

      <Footer />
    </>
  );
}

export default LendingWrapper;
