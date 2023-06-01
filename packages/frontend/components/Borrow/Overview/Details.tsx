import { Box, Divider, Grid, Stack, Typography } from '@mui/material';
import { BorrowingVault, LendingProviderWithFinancials } from '@x-fuji/sdk';

import { chainName } from '../../../helpers/chains';
import { NetworkIcon, ProviderIcon } from '../../Shared/Icons';

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
  return (
    <>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Details
      </Typography>

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
          <Typography variant="smallDark">
            {isMobile
              ? 'Liquidation Threshold'
              : 'Loan-to-Value Liquidation Threshold'}
          </Typography>

          <Typography variant="small">{ltvThreshold}%</Typography>
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
