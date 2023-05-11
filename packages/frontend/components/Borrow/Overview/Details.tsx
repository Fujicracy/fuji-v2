import { Box, Divider, Grid, Stack, Typography, useTheme } from '@mui/material';
import { BorrowingVault, LendingProviderDetails } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';

import { chainName } from '../../../helpers/chains';
import { NetworkIcon, ProviderIcon } from '../../Shared/Icons';
import InfoTooltip from '../../Shared/Tooltips/InfoTooltip';
import ProvidersTooltip from '../../Shared/Tooltips/ProvidersTooltip';
import TooltipWrapper from '../../Shared/Tooltips/TooltipWrapper';

type DetailsProps = {
  ltv: number;
  ltvThreshold: number;
  isMobile: boolean;
  isEditing: boolean;
  vault?: BorrowingVault;
  providers?: LendingProviderDetails[];
};

function Details({
  ltv,
  ltvThreshold,
  providers,
  vault,
  isMobile,
  isEditing,
}: DetailsProps) {
  const { palette } = useTheme();

  return (
    <>
      <Typography variant="body2">Details</Typography>

      <br />

      <DetailContainer isMobile={isMobile}>
        {isEditing && (
          <>
            <Grid container justifyContent="space-between">
              <Typography variant="smallDark">Current Loan-to-Value</Typography>

              <Typography variant="small">
                {ltv <= 100 && ltv >= 0 ? `${ltv.toFixed(0)}%` : 'n/a'}
              </Typography>
            </Grid>
            <DetailDivider isMobile={isMobile} />
          </>
        )}

        <Grid container justifyContent="space-between">
          <Typography variant="smallDark">
            Loan-to-Value Liquidation Threshold
          </Typography>

          <Typography variant="small">{ltvThreshold}%</Typography>
        </Grid>

        <DetailDivider isMobile={isMobile} />

        <Grid container justifyContent="space-between">
          <Grid item>
            <Typography variant="smallDark">Collateral Deposited On</Typography>
          </Grid>
          <Grid item>
            {providers?.length ? (
              <Stack direction="row" gap={0.6} alignItems="center">
                <ProviderIcon
                  provider={providers.find((p) => p.active)?.name || ''}
                  height={18}
                  width={18}
                />
                <Typography variant="small">
                  {providers.find((p) => p.active)?.name} on
                </Typography>
                <NetworkIcon
                  network={vault?.chainId || ''}
                  height={18}
                  width={18}
                />
                <Typography variant="small">
                  {chainName(vault?.chainId)}
                </Typography>
              </Stack>
            ) : (
              'n/a'
            )}
          </Grid>
        </Grid>

        <DetailDivider isMobile={isMobile} />

        <Grid container justifyContent="space-between">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="smallDark">
              Collateral Interest Rate (APY)
            </Typography>
            <InfoTooltip
              isDark
              title="APR, or annual percentage rate, represents the price you pay to borrow money."
            />
          </div>
          <TooltipWrapper
            placement="top-end"
            title={<ProvidersTooltip providers={providers} />}
          >
            <Box sx={{ alignItems: 'center' }}>
              {providers?.length ? (
                <Typography variant="small">
                  <span style={{ color: palette.success.main }}>
                    {(
                      parseFloat(formatUnits(providers[0].depositRate, 27)) *
                      100
                    ).toFixed(2)}
                    %
                  </span>
                </Typography>
              ) : (
                'n/a'
              )}
            </Box>
          </TooltipWrapper>
        </Grid>

        <DetailDivider isMobile={isMobile} />

        <Grid container justifyContent="space-between">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="smallDark">
              Borrow Interest Rate (APR)
            </Typography>
            <InfoTooltip
              isDark
              title="APR, or annual percentage rate, represents the price you pay to borrow money."
            />
          </div>
          <TooltipWrapper
            placement="top-end"
            title={<ProvidersTooltip providers={providers} isBorrow />}
          >
            <Box sx={{ alignItems: 'center' }}>
              {providers?.length ? (
                <Typography variant="small">
                  <span style={{ color: palette.warning.main }}>
                    {(
                      parseFloat(formatUnits(providers[0].borrowRate, 27)) * 100
                    ).toFixed(2)}
                    %
                  </span>
                </Typography>
              ) : (
                'n/a'
              )}
            </Box>
          </TooltipWrapper>
        </Grid>
      </DetailContainer>
    </>
  );
}

export default Details;

type DetailContainerProps = {
  children: React.ReactNode;
  isMobile: boolean;
};

function DetailContainer({ children, isMobile }: DetailContainerProps) {
  return isMobile ? (
    <Grid container direction="column" rowSpacing="0.75rem">
      {children}
    </Grid>
  ) : (
    <>{children} </>
  );
}

function DetailDivider({ isMobile }: { isMobile: boolean }) {
  return isMobile ? <></> : <Divider sx={{ mt: 2, mb: 2 }} />;
}
