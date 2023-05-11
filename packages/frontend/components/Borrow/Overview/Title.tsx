import { Divider, Stack, Typography } from '@mui/material';
import { BorrowingVault, LendingProviderDetails } from '@x-fuji/sdk';

import { DocsTooltip } from '../../Shared/Tooltips';
import VaultsMenu from './VaultsMenu';

type TitleProps = {
  selectedTab: number;
  onTabClick: (tab: number) => void;
  providers?: LendingProviderDetails[];
  vault?: BorrowingVault;
};

function Title({ providers, vault, selectedTab, onTabClick }: TitleProps) {
  const tabs = ['Overview', 'Analytics'];

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
            <VaultsMenu
              providers={providers}
              safetyRating={Number(vault?.safetyRating?.toString())}
            />
          </Stack>
        )}
      </Stack>
      <Divider sx={{ mb: '1.5rem' }} />
    </>
  );
}

export default Title;
