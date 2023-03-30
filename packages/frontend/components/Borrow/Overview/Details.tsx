import { Box, Divider, Grid, Stack, Typography, useTheme } from '@mui/material';
import { BorrowingVault, LendingProviderDetails } from '@x-fuji/sdk';
import { formatUnits } from 'ethers/lib/utils';

import { chainName } from '../../../helpers/chains';
import { NetworkIcon, ProviderIcon } from '../../Shared/Icons';
import APRTooltip from '../../Shared/Tooltips/APRTooltip';

type DetailsProps = {
  ltv: number;
  ltvThreshold: number;
  providers: LendingProviderDetails[] | undefined;
  vault: BorrowingVault | undefined;
  isMobile: boolean;
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
          <Grid item>
            <Typography variant="smallDark">
              Collateral will be deposited into
            </Typography>
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
            <Typography variant="smallDark">Deposit Interest (APR)</Typography>
            <APRTooltip />
          </div>
          <Box sx={{ alignItems: 'center' }}>
            {providers?.length ? (
              <Typography variant="small">
                {providers[0].name}:{' '}
                <span style={{ color: palette.success.main }}>
                  {(
                    parseFloat(formatUnits(providers[0].depositRate, 27)) * 100
                  ).toFixed(2)}
                  %
                </span>
              </Typography>
            ) : (
              'n/a'
            )}
          </Box>
        </Grid>

        <DetailDivider isMobile={isMobile} />

        <Grid container justifyContent="space-between">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="smallDark">Borrow Interest (APR)</Typography>
            <APRTooltip />
          </div>
          <Box sx={{ alignItems: 'center' }}>
            {providers?.length ? (
              <Typography variant="small">
                {providers[0].name}:{' '}
                <span style={{ color: palette.success.main }}>
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
