import { Box, Divider, Grid, Stack, Typography, useTheme } from '@mui/material';
import { BorrowingVault, LendingProviderWithFinancials } from '@x-fuji/sdk';

import { chainName } from '../../../helpers/chains';
import { NetworkIcon, ProviderIcon } from '../../Shared/Icons';
import APRTooltip from '../../Shared/Tooltips/APRTooltip';
import ProvidersTooltip from '../../Shared/Tooltips/ProvidersTooltip';
import TooltipWrapper from '../../Shared/Tooltips/TooltipWrapper';

type DetailsProps = {
  ltv: number;
  ltvThreshold: number;
  isMobile: boolean;
  isEditing: boolean;
  vault?: BorrowingVault;
  providers?: LendingProviderWithFinancials[];
  activeProvider?: LendingProviderWithFinancials;
};

function Details({
  ltv,
  ltvThreshold,
  providers,
  activeProvider,
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
            {isMobile
              ? 'Liquidation Threshold'
              : 'Loan-to-Value Liquidation Threshold'}
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
                  provider={activeProvider?.name || ''}
                  height={18}
                  width={18}
                />
                <Typography variant="small">
                  {activeProvider?.name} on
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
          </div>
          <TooltipWrapper
            placement="top-end"
            title={<ProvidersTooltip providers={providers} />}
          >
            <Box sx={{ alignItems: 'center' }}>
              {activeProvider ? (
                <Typography variant="small">
                  <span style={{ color: palette.success.main }}>
                    {activeProvider.depositAprBase?.toFixed(2)}%
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
            <APRTooltip />
          </div>
          <TooltipWrapper
            placement="top-end"
            title={<ProvidersTooltip providers={providers} isBorrow />}
          >
            <Box sx={{ alignItems: 'center' }}>
              {activeProvider ? (
                <Typography variant="small">
                  <span style={{ color: palette.warning.main }}>
                    {activeProvider.borrowAprBase?.toFixed(2)}%
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
  return isMobile ? (
    <Box sx={{ m: '0.375rem 0' }} />
  ) : (
    <Divider sx={{ mt: 2, mb: 2 }} />
  );
}
