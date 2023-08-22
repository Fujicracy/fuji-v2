import { Container, Divider, Grid } from '@mui/material';
import { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';

import MigrateFrom from '../components/Migrator/MigrateFrom';
import MigratePosition from '../components/Migrator/MigratePosition';
import MigrateTo from '../components/Migrator/MigrateTo';
import { getRows, PositionRow } from '../helpers/positions';
import { useAuth } from '../store/auth.store';
import { usePositions } from '../store/positions.store';

const MigratePage: NextPage = () => {
  const [rows, setRows] = useState<PositionRow[]>([]);
  const [selected, setSelected] = useState<PositionRow | null>(null);
  const [provider, setProvider] = useState<string>('compound');
  const [isPositionSelected, setIsPositionSelected] = useState<boolean>(false);
  const [isFormFormFilled, setIsFormFormFilled] = useState<boolean>(false);
  const loading = usePositions((state) => state.loading);
  const positions = usePositions((state) => state.borrowPositions);
  const account = useAuth((state) => state.address);

  const onNext = () => setIsPositionSelected(true);

  const onFromFormFilled = () => {
    setIsFormFormFilled(true);
  };

  const onBack = () => {
    setSelected(null);
    setIsPositionSelected(false);
  };

  useEffect(() => {
    (() => {
      if (loading) return;
      setRows(getRows(positions));
    })();
  }, [loading, account, positions]);

  return (
    <>
      <Head>
        <title>Fuji V2 Himalaya</title>
        <meta
          name="description"
          content="Cross-chain borrow/lending position migrator."
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
        }}
      >
        <Grid
          container
          wrap="wrap"
          alignItems="flex-start"
          justifyContent="center"
        >
          {!isPositionSelected ? (
            <Grid item xs={6}>
              <MigratePosition
                provider={provider}
                loading={loading}
                rows={rows}
                selected={selected}
                setSelected={setSelected}
                onNext={onNext}
              />
            </Grid>
          ) : (
            <>
              <Grid item xs={4}>
                <MigrateFrom
                  onBack={onBack}
                  position={selected!}
                  onNext={onFromFormFilled}
                />
              </Grid>
              {isFormFormFilled && (
                <Grid item xs={4} ml={{ xs: 0, md: 3 }} mt={{ xs: 3, md: 0 }}>
                  <MigrateTo />
                </Grid>
              )}
            </>
          )}
        </Grid>
      </Container>
    </>
  );
};

export default MigratePage;
