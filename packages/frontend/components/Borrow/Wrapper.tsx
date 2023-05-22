import {
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import Borrow from '../../components/Borrow/Borrow';
import Footer from '../../components/Shared/Footer';
import { PATH } from '../../constants';
import {
  BasePosition,
  viewDynamicPosition,
  viewEditedPosition,
} from '../../helpers/positions';
import { useAuth } from '../../store/auth.store';
import { FormType, useBorrow } from '../../store/borrow.store';
import { Position } from '../../store/models/Position';
import { usePositions } from '../../store/positions.store';
import Header from '../Shared/Header/Header';
import Overview from './Overview/Overview';

type BorrowWrapperProps = {
  query?: {
    address: string;
    chain: string;
  };
};

function BorrowWrapper({ query }: BorrowWrapperProps) {
  const { breakpoints, palette } = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const address = useAuth((state) => state.address);
  const positions = usePositions((state) => state.positions);
  const baseCollateral = useBorrow((state) => state.collateral);
  const baseDebt = useBorrow((state) => state.debt);
  const baseLtv = useBorrow((state) => state.ltv);
  const mode = useBorrow((state) => state.mode);
  const formType = useBorrow((state) => state.formType);

  const isEditing = formType !== FormType.Create;

  const [basePosition, setBasePosition] = useState<BasePosition | undefined>(
    baseDebt ? viewDynamicPosition(!isEditing, undefined) : undefined
  );
  const [loading, setLoading] = useState<boolean>(
    isEditing && (!positions || positions.length === 0)
  );

  useEffect(() => {
    let matchPosition: Position | undefined;
    let editedPosition: Position | undefined;

    if (address && positions.length > 0 && query) {
      matchPosition = positions.find(
        (position) =>
          position.vault?.address.value === query.address &&
          position.vault?.chainId.toString() === query.chain
      );
      editedPosition =
        matchPosition && baseDebt
          ? viewEditedPosition(baseCollateral, baseDebt, matchPosition, mode)
          : undefined;
    }
    const basePosition = viewDynamicPosition(
      !isEditing,
      matchPosition,
      editedPosition
    );
    setBasePosition(basePosition);
  }, [
    baseCollateral,
    baseDebt,
    baseLtv,
    address,
    positions,
    mode,
    isEditing,
    query,
  ]);

  /*
    Draft implementation: problem is, if the user opens /my-position/[pid] directly,
    we don't have the positions loaded yet. So we need to wait for the data to load
    and change the values in the store.
  */
  useEffect(() => {
    if (isEditing && loading && basePosition) {
      const vault = basePosition.position.vault;
      if (vault) {
        const changeAll = useBorrow.getState().changeAll;
        changeAll(vault.collateral, vault.debt, vault);
        setLoading(false);
      }
    }
  }, [isEditing, basePosition, loading]);

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

      <Header />

      <Divider
        sx={{
          display: { xs: 'block', sm: 'none' },
          mb: '1rem',
        }}
      />

      <Container
        sx={{
          mt: { xs: '0', sm: '5rem' },
          mb: { xs: '7rem', sm: '0' },
          pl: { xs: '0.25rem', sm: '1rem' },
          pr: { xs: '0.25rem', sm: '1rem' },
          minHeight: '75vh',
        }}
      >
        {isEditing && !loading && (
          <Stack
            flexDirection="row"
            alignItems="center"
            onClick={() => router.push(PATH.MY_POSITIONS)}
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
              View all active positions
            </Typography>
          </Stack>
        )}

        {loading ? (
          <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            justifyContent="center"
            style={{ minHeight: '100vh' }}
          >
            <CircularProgress size={32} />
          </Grid>
        ) : (
          <Grid container wrap="wrap" alignItems="flex-start" spacing={3}>
            <Grid item xs={12} md={5}>
              <Borrow isEditing={isEditing} basePosition={basePosition} />
            </Grid>
            {basePosition && (
              <Grid item sm={12} md={7}>
                <Overview isEditing={isEditing} basePosition={basePosition} />
              </Grid>
            )}
          </Grid>
        )}
      </Container>

      {!isMobile && <Footer />}
    </>
  );
}

export default BorrowWrapper;
