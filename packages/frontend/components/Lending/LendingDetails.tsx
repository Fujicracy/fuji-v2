import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Card, Grid, Skeleton, Stack, Tooltip } from '@mui/material';
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
import VaultSelect from '../Shared/Operation/VaultSelect/VaultSelect';
import InfoBlock from './InfoBlock';
import VaultStrategy from './VaultStrategy';

type LendingDetailsProps = {
  isEditing: boolean;
  positionData?: PositionData;
};

function LendingDetails({ isEditing, positionData }: LendingDetailsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(Period.MONTH);
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
              position && position.collateral.amount
                ? `${formatValue(position.collateral.amount, {
                    maximumFractionDigits: 3,
                    minimumFractionDigits: 2,
                  })} ${position.collateral.currency.wrapped.symbol}`
                : '0.00'
            }
            amount={position?.collateral.amount}
            extra={positionData?.editedPosition?.collateral.amount}
            loading={loading}
            contrast
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <InfoBlock
            label={`Total Supplied${
              activeProvider?.name ? ` (${activeProvider?.name})` : ''
            }`}
            value={
              availableVaults[0] && activeProvider?.totalSupplyUsd ? (
                formatValue(activeProvider?.totalSupplyUsd, {
                  maximumSignificantDigits: 3,
                  notation: 'compact',
                  style: 'currency',
                })
              ) : (
                <Tooltip
                  title="Error loading data"
                  arrow
                  sx={{ width: 20, height: 20 }}
                >
                  <ErrorOutlineIcon />
                </Tooltip>
              )
            }
            loading={loading}
            contrast
          />
        </Grid>
      </Grid>

      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: '0 1.5rem 1.5rem 1.5rem',
          overflow: 'unset',
        }}
      >
        <Stack
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ width: '100%' }}
        >
          <Stack flexDirection="column" justifyContent="center" mt={3} mb={2}>
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

          <PeriodOptions
            onChange={setSelectedPeriod}
            isDayExcluded={true}
            defaultValue={Period.MONTH}
          />
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

      <Box mb={3}>
        <VaultStrategy />
      </Box>

      {/*<RiskBlock />*/}
    </>
  );
}

export default LendingDetails;
