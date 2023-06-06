import {
  CircularProgress,
  Container,
  Divider,
  Grid,
  Grow,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import Borrow from '../../components/Borrow/Borrow';
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
import Footer from '../App/Footer';
import Overview from './Overview/Overview';
import VaultSelect from './VaultSelect/VaultSelect';

type BorrowWrapperProps = {
  formType: FormType;
  query?: {
    address: string;
    chain: string;
  };
};

const ANIMATION_DURATION = 1000;

function BorrowWrapper({ formType, query }: BorrowWrapperProps) {
  const { palette } = useTheme();
  const router = useRouter();

  const address = useAuth((state) => state.address);
  const positions = usePositions((state) => state.positions);
  const baseCollateral = useBorrow((state) => state.collateral);
  const baseDebt = useBorrow((state) => state.debt);
  const baseLtv = useBorrow((state) => state.ltv);
  const mode = useBorrow((state) => state.mode);
  const willLoadBorrow = useBorrow((state) => state.willLoadBorrow);

  const isEditing = formType !== FormType.Create;

  const [basePosition, setBasePosition] = useState<BasePosition | undefined>(
    baseDebt
      ? viewDynamicPosition(isEditing, willLoadBorrow, undefined)
      : undefined
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
      isEditing,
      willLoadBorrow,
      matchPosition,
      editedPosition
    );
    setBasePosition(basePosition);
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
          '@media (min-width: 1200px)': {
            '&.MuiContainer-root': {
              maxWidth: '1300px !important',
            },
          },
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
              in={Boolean(basePosition)}
              timeout={{ enter: isEditing ? 0 : ANIMATION_DURATION }}
            >
              {basePosition ? (
                <Grid
                  item
                  xs={12}
                  sm={9.5}
                  md={7}
                  order={{ xs: 2, md: 1 }}
                  sx={{}}
                >
                  {!isEditing && <VaultSelect />}
                  <Overview isEditing={isEditing} basePosition={basePosition} />
                </Grid>
              ) : (
                <div />
              )}
            </Grow>
            <Grid item xs={12} md={5} order={{ xs: 1, md: 2 }}>
              <Borrow isEditing={isEditing} basePosition={basePosition} />
            </Grid>
          </Grid>
        )}
      </Container>

      <Footer />
    </>
  );
}

export default BorrowWrapper;
