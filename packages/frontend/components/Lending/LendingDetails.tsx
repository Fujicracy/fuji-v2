import { Card, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AprResult, LendingVault } from '@x-fuji/sdk';
import React, { useEffect, useRef, useState } from 'react';

import { bigToFloat, formatBalance } from '../../helpers/values';
import { useLend } from '../../store/lend.store';
import VaultSelect from '../Borrow/VaultSelect/VaultSelect';
import InfoBlock from '../Shared/Analytics/InfoBlock';
import AprValue from '../Shared/AprValue';
import APYChart from '../Shared/Charts/APYChart';
import EmptyChartState from '../Shared/Charts/EmptyState';
import PeriodOptions from '../Shared/Filters/PeriodOptions';
import RiskBlock from './RiskBlock';
import VaultStrategy from './VaultStrategy';

function LendingDetails() {
  const { palette } = useTheme();

  const [selectedPeriod, setSelectedPeriod] = useState(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [depositData, setDepositData] = useState<AprResult[]>([]);
  const vault = useLend((state) => state.activeVault);
  const availableVaults = useLend((state) => state.availableVaults);
  const prevVault = useRef<LendingVault | undefined>(undefined);

  useEffect(() => {
    if (vault && vault.address !== prevVault.current?.address) {
      (async () => {
        prevVault.current = vault;

        setLoading(true);

        const depositResult = await vault.getSupplyProviderStats();
        setDepositData(depositResult.success ? depositResult.data : []);

        setLoading(false);
      })();
    }
  }, [depositData, vault]);

  return (
    <>
      <VaultSelect type="lend" />
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: '0 1.5rem 1.5rem 1.5rem',
        }}
      >
        <Stack
          flexDirection="row"
          justifyContent="space-between"
          sx={{ width: '100%' }}
        >
          <Stack
            flexDirection="column"
            justifyContent="center"
            alignItems="start"
          >
            {loading ? (
              <>
                <Skeleton
                  sx={{
                    width: '3.5rem',
                    height: '3rem',
                    m: '0',
                  }}
                />
                <Skeleton
                  sx={{
                    width: '5.5rem',
                    height: '3rem',
                    m: '-1rem 0',
                  }}
                />
              </>
            ) : (
              <>
                <Typography
                  variant="body2"
                  fontSize="1.125rem"
                  fontWeight={700}
                  lineHeight="1.8rem"
                >
                  {'2.07%'}
                </Typography>
                <Typography
                  variant="smallDark"
                  fontSize="0.875rem"
                  lineHeight="1.4rem"
                >
                  {'Mar 15, 2023'}
                </Typography>
              </>
            )}
          </Stack>

          <PeriodOptions onChange={setSelectedPeriod} isDayExcluded={true} />
        </Stack>

        {loading ? (
          <Skeleton
            sx={{
              width: '100%',
              height: '38rem',
              m: '-7rem 0 -6rem 0',
            }}
          />
        ) : depositData.length > 0 ? (
          <>
            <APYChart data={depositData} tab={1} period={selectedPeriod} />
          </>
        ) : (
          <EmptyChartState />
        )}
      </Card>

      <Grid container spacing={2} mt={0}>
        <Grid item xs={12} sm={6}>
          <InfoBlock
            loading={loading}
            tooltip="test"
            label="Current APY"
            value={
              availableVaults[0] && (
                <AprValue
                  providerName={availableVaults[0]?.activeProvider.name}
                  base={availableVaults[0]?.activeProvider.depositAprBase || 0}
                  justify="left"
                  positive
                />
              )
            }
            contrast
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          {availableVaults[0] && (
            <InfoBlock
              label="Total Supplied"
              value={`${formatBalance(
                bigToFloat(
                  availableVaults[0].vault.collateral.decimals,
                  availableVaults[0]?.depositBalance
                )
              )} ${availableVaults[0].vault.collateral.symbol}`}
              loading={loading}
              contrast
            />
          )}
        </Grid>
      </Grid>

      <VaultStrategy />

      <RiskBlock />
    </>
  );
}

export default LendingDetails;