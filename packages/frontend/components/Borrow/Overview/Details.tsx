import { Box, Divider, Grid, Typography, useTheme } from '@mui/material';
import { BorrowingVault, LendingProviderDetails } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';

import { NetworkIcon } from '../../Shared/Icons';
import APRTooltip from '../../Shared/Tooltips/APRTooltip';
import ProvidersTooltip from '../../Shared/Tooltips/ProvidersTooltip';
import TooltipWrapper from '../../Shared/Tooltips/TooltipWrapper';

type DetailsProps = {
  ltv: number;
  ltvThreshold: number;
  isMobile: boolean;
  vault?: BorrowingVault;
  providers?: LendingProviderDetails[];
};

function Details({
  ltv,
  ltvThreshold,
  providers,
  vault,
  isMobile,
}: DetailsProps) {
  const { palette } = useTheme();

  return (
    <>
      <Typography variant="body2">Details</Typography>

      <br />

      <DetailContainer isMobile={isMobile}>
        <Grid container justifyContent="space-between">
          <Typography variant="smallDark">Current Loan-to-Value</Typography>

          <Typography variant="small">
            {ltv <= 100 && ltv >= 0 ? `${ltv.toFixed(0)}%` : 'n/a'}
          </Typography>
        </Grid>

        <DetailDivider isMobile={isMobile} />

        <Grid container justifyContent="space-between">
          <Typography variant="smallDark">LTV liquidation threshold</Typography>

          <Typography variant="small">{ltvThreshold}%</Typography>
        </Grid>

        <DetailDivider isMobile={isMobile} />

        <Grid container justifyContent="space-between">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="smallDark">Deposit Interest (APR)</Typography>
            <APRTooltip />
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
            <Typography variant="smallDark">Borrow Interest (APR)</Typography>
            <APRTooltip />
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

        <DetailDivider isMobile={isMobile} />

        <Grid container justifyContent="space-between">
          <Grid item>
            <Typography variant="smallDark">Collateral Deposited On</Typography>
          </Grid>
          <Grid item>
            {providers?.length ? (
              <Grid container alignItems="center">
                <NetworkIcon
                  network={vault?.chainId || ''}
                  height={18}
                  width={18}
                />

                <Typography ml="0.375rem" variant="small">
                  {providers.find((p) => p.active)?.name}
                </Typography>
              </Grid>
            ) : (
              'n/a'
            )}
          </Grid>
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
