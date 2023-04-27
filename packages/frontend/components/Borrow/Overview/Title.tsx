import { Divider, Stack, Typography } from '@mui/material';
import { BorrowingVault, LendingProviderDetails } from '@x-fuji/sdk';

import { DocsTooltip } from '../../Shared/Tooltips';
import VaultsMenu from './VaultsMenu';

type TitleProps = {
  providers: LendingProviderDetails[] | undefined;
  vault: BorrowingVault | undefined;
};

function Title({ providers, vault }: TitleProps) {
  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        height="40px"
      >
        <Typography variant="body2">Overview</Typography>
        {providers && vault && (
          <Stack direction="row" alignItems="center">
            <DocsTooltip />
            <Typography variant="smallDark" ml={0.5} mr={1}>
              Safety rating:
            </Typography>
            <VaultsMenu
              providers={providers}
              safetyRating={vault?.safetyRating}
            />
          </Stack>
        )}
      </Stack>
      <Divider sx={{ mt: '1rem', mb: '1.5rem' }} />
    </>
  );
}

export default Title;
