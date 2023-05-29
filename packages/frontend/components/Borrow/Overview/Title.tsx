import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import { BorrowingVault, LendingProviderWithFinancials } from '@x-fuji/sdk';

import { ratingToNote } from '../../../helpers/ratings';
import { ProviderIcon } from '../../Shared/Icons';
import { DocsTooltip } from '../../Shared/Tooltips';

type TitleProps = {
  selectedTab: number;
  onTabClick: (tab: number) => void;
  providers?: LendingProviderWithFinancials[];
  vault?: BorrowingVault;
};

function Title({ providers, vault, selectedTab, onTabClick }: TitleProps) {
  const tabs = ['Overview']; // 'Analytics'

  const safetyRating = Number(vault?.safetyRating?.toString());
  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="start"
        height="56px"
      >
        <Stack
          direction="row"
          justifyContent="start"
          alignItems="center"
          sx={{ gap: '2rem', height: '100%' }}
        >
          {tabs.map((tab, i) => (
            <Typography
              key={i}
              lineHeight="2.5rem"
              sx={{
                cursor: 'pointer',
                pb: '1rem',
                borderBottom:
                  i === selectedTab
                    ? '1px solid white'
                    : '1px solid transparent',
              }}
              variant="body2"
              onClick={() => onTabClick(i)}
            >
              {tab}
            </Typography>
          ))}
        </Stack>
        {providers && vault && (
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
      <Divider sx={{ mb: '1.5rem' }} />
    </>
  );
}

export default Title;
