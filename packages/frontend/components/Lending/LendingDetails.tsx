import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Card, Grid, Skeleton, Stack, Tooltip } from '@mui/material';
import { AprResult, LendingVault, VaultType } from '@x-fuji/sdk';
import React, { useEffect, useRef, useState } from 'react';

import { Period } from '../../helpers/charts';
import { PositionData } from '../../helpers/positions';
import { formatValue } from '../../helpers/values';
import { useLend } from '../../store/lend.store';
import APYChart from '../Shared/Charts/APYChart';
import ChartAPYHeader from '../Shared/Charts/ChartAPYHeader';
import EmptyChartState from '../Shared/Charts/EmptyState';
import PeriodOptions from '../Shared/Filters/PeriodOptions';
import InfoBlock from '../Shared/InfoBlock';
import VaultSelect from '../Shared/VaultSelect/VaultSelect';
import RiskBlock from './RiskBlock';
import VaultStrategy from './VaultStrategy';

type LendingDetailsProps = {
  isEditing: boolean;
  positionData?: PositionData;
};

function LendingDetails({ isEditing, positionData }: LendingDetailsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(Period.WEEK);
  const [loading, setLoading] = useState<boolean>(false);
  const [depositData, setDepositData] = useState<AprResult[]>([]);

  const vault = useLend((state) => state.activeVault);
  const activeProvider = useLend((state) => state.activeProvider);
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

  const { position } = positionData || {};

  return (
    <>
      {!isEditing && <VaultSelect type={VaultType.LEND} />}

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6}>
          <InfoBlock
            label={`My Deposits`}
            value={
              position
                ? `${formatValue(position.collateral.amount, {
                    maximumFractionDigits: 3,
                  })} ${position.collateral.currency.wrapped.symbol}`
                : 0
            }
            loading={loading}
            contrast
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          {availableVaults[0] && (
            <InfoBlock
              label={`Total Supplied (${activeProvider?.name})`}
              value={
                `${formatValue(activeProvider?.totalSupplyUsd, {
                  style: 'currency',
                })}` || (
                  <Tooltip title="Error loading data" arrow>
                    <ErrorOutlineIcon />
                  </Tooltip>
                )
              }
              loading={loading}
              contrast
            />
          )}
        </Grid>
      </Grid>

      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: '0 1.5rem',
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
              <ChartAPYHeader
                activeProvider={activeProvider}
                type={VaultType.LEND}
              />
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
        ) : depositData &&
          depositData.length > 0 &&
          depositData.some((data) => data.aprStats.length > 0) ? (
          <>
            <APYChart data={depositData} tab={1} period={selectedPeriod} />
          </>
        ) : (
          <EmptyChartState />
        )}
      </Card>

      <VaultStrategy />

      <RiskBlock />
    </>
  );
}

export default LendingDetails;
