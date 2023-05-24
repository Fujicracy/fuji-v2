import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import { BorrowingVault, LendingProviderWithFinancials } from '@x-fuji/sdk';

import { ratingToNote } from '../../../helpers/ratings';
import { ProviderIcon } from '../../Shared/Icons';
import { DocsTooltip } from '../../Shared/Tooltips';

type TitleProps = {
  providers: LendingProviderWithFinancials[] | undefined;
  vault: BorrowingVault | undefined;
};

function Title({ providers, vault }: TitleProps) {
  const safetyRating = Number(vault?.safetyRating?.toString());
  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        height="40px"
      >
        <Typography variant="body2">Overview</Typography>
        {providers && (
          <Stack direction="row" alignItems="center">
            <DocsTooltip />
            <Typography variant="smallDark" ml={0.5} mr={1}>
              Safety rating:
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                variant={safetyRating > 75 ? 'success' : 'warning'}
                label={ratingToNote(safetyRating)}
                sx={{ '& .MuiChip-label': { p: '0.25rem 0.5rem' } }}
              />
              <Box display="flex" alignItems="center">
                {providers &&
                  providers.map((p, index) => (
                    <ProviderIcon
                      key={index}
                      provider={p.name}
                      height={16}
                      width={16}
                    />
                  ))}
              </Box>
            </Stack>
          </Stack>
        )}
      </Stack>
      <Divider sx={{ mt: '1rem', mb: '1.5rem' }} />
    </>
  );
}

export default Title;
