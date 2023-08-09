import {
  CircularProgress,
  Container,
  Divider,
  Grid,
  Grow,
} from '@mui/material';
import { BorrowingVault, VaultType } from '@x-fuji/sdk';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';

import {
  PositionData,
  viewDynamicBorrowingPosition,
  viewEditedBorrowingPosition,
} from '../../helpers/positions';
import { useAuth } from '../../store/auth.store';
import { useBorrow } from '../../store/borrow.store';
import { BorrowingPosition, Position } from '../../store/models/Position';
import { useNavigation } from '../../store/navigation.store';
import { usePositions } from '../../store/positions.store';
import { FormType } from '../../store/types/state';
import Footer from '../App/Footer';
import BackToList from '../Shared/BackToList';
import VaultSelect from '../Shared/Operation/VaultSelect/VaultSelect';
import BorrowForm from './Form';
import Overview from './Overview/Overview';

type BorrowWrapperProps = {
  formType: FormType;
  query?: {
    address: string;
    chain: string;
  };
};

const ANIMATION_DURATION = 1000;

function BorrowWrapper({ formType, query }: BorrowWrapperProps) {
  const address = useAuth((state) => state.address);
  const positions = usePositions((state) => state.borrowPositions);
  const baseCollateral = useBorrow((state) => state.collateral);
  const baseDebt = useBorrow((state) => state.debt);
  const baseLtv = useBorrow((state) => state.ltv);
  const mode = useBorrow((state) => state.mode);
  const willLoadBorrow = useNavigation((state) => state.borrowPage.willLoad);

  const isEditing = formType === FormType.Edit;

  const [positionData, setPositionData] = useState<PositionData | undefined>(
    undefined
  );
  const [loading, setLoading] = useState<boolean>(
    isEditing && (!positions || positions.length === 0)
  );

  useEffect(() => {
    let matchPosition: BorrowingPosition | undefined;
    let editedPosition: Position | undefined;

    if (address && positions.length > 0 && query) {
      matchPosition = positions.find(
        (position) =>
          position.vault?.address.value === query.address &&
          position.vault?.chainId.toString() === query.chain
      );

      editedPosition =
        matchPosition && baseDebt
          ? viewEditedBorrowingPosition(
              baseCollateral,
              baseDebt,
              matchPosition,
              mode
            )
          : undefined;
    }

    if (willLoadBorrow) return;

    const newPositionData = viewDynamicBorrowingPosition(
      isEditing,
      willLoadBorrow,
      matchPosition,
      editedPosition as BorrowingPosition
    );

    setPositionData(newPositionData);
  }, [
    formType,
    baseCollateral,
    baseDebt,
    baseLtv,
    address,
    positions,
    mode,
    isEditing,
    willLoadBorrow,
    query,
  ]);

  /*
    Draft implementation: problem is, if the user opens /my-position/[pid] directly,
    we don't have the positions loaded yet. So we need to wait for the data to load
    and change the values in the store.
  */
  useEffect(() => {
    if (isEditing && loading && positionData) {
      const vault = positionData.position.vault;
      if (vault && vault instanceof BorrowingVault) {
        const changeAll = useBorrow.getState().changeAll;
        changeAll(vault, vault.collateral, vault.debt);
        setLoading(false);
      }
    }
  }, [isEditing, positionData, loading]);

  return (
    <>
      <Head>
        <title>{`${
          isEditing ? 'Position' : 'Borrow'
        } - Fuji V2 Himalaya`}</title>
        <meta
          name="description"
          content="Deposit, borrow and repay your positions from any chain."
        />
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
          pl: { xs: '0.25rem' },
          pr: { xs: '0.25rem' },
          minHeight: '75vh',
          '@media (min-width: 1200px)': {
            '&.MuiContainer-root': {
              maxWidth: '1200px !important',
              boxSizing: 'border-box',
            },
          },
        }}
      >
        {isEditing && !loading && (
          <BackToList type={VaultType.BORROW} isEditing={isEditing} />
        )}

        {loading ? (
          <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            justifyContent="center"
            style={{ minHeight: '75vh' }}
          >
            <CircularProgress size={32} />
          </Grid>
        ) : (
          <Grid
            container
            wrap="wrap"
            alignItems="flex-start"
            justifyContent="center"
            spacing={3}
          >
            <Grow
              in={Boolean(positionData)}
              timeout={{ enter: isEditing ? 0 : ANIMATION_DURATION }}
            >
              {positionData ? (
                <Grid item xs={12} sm={9.5} md={7.75} order={{ xs: 2, md: 1 }}>
                  {!isEditing && <VaultSelect />}
                  <Overview isEditing={isEditing} positionData={positionData} />
                </Grid>
              ) : (
                <div />
              )}
            </Grow>
            <Grid
              item
              xs={12}
              md={4.25}
              order={{ xs: 1, md: 2 }}
              mt={positionData ? { xs: 0, md: '2.6rem' } : 0}
              sx={{ transition: `all ${isEditing ? '0ms' : '500ms'} ease-in` }}
            >
              <BorrowForm isEditing={isEditing} positionData={positionData} />
            </Grid>
          </Grid>
        )}
      </Container>

      <Footer />
    </>
  );
}

export default BorrowWrapper;
