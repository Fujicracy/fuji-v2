import { alpha, Box, Card, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import React, { useMemo } from 'react';

import { rearrangeProvidersWithActiveInCenter } from '../../helpers/lending';
import { useLend } from '../../store/lend.store';
import { ProviderIcon } from '../Shared/Icons';
import { TooltipWrapper } from '../Shared/Tooltips';

function VaultStrategy() {
  const { palette } = useTheme();
  const allProviders = useLend((state) => state.allProviders);

  const rearrangedProviders = useMemo(() => {
    return rearrangeProvidersWithActiveInCenter(allProviders);
  }, [allProviders]);

  return (
    <>
      <Typography variant="body2" mt={6}>
        Vault Strategy
      </Typography>
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: '0',
          mt: '1rem',
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="column"
          alignItems="center"
          justifyContent="center"
          width="100%"
          p="1.5rem 1rem 1rem 1rem"
          sx={{
            position: 'relative',
            background: 'linear-gradient(90deg, #1B1B1B 0%, #000000 100%)',
            overflow: 'hidden',
          }}
        >
          <Typography variant="xsmall">Underlying money markets</Typography>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            sx={{
              p: '0.31rem 1rem',
              backgroundColor: palette.secondary.contrastText,
              border: `1px solid ${alpha('#FFFFFF', 0.2)}`,
              borderRadius: '0.75rem',
              minWidth: '8rem',
              mt: '0.5rem',
            }}
          >
            {rearrangedProviders.map((provider, index) => (
              <Box
                key={`${provider.name}-${index}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 33,
                  height: 33,
                  p: 0,
                  borderRadius: '50%',
                  border: `1px solid ${
                    provider.active ? 'white' : 'transparent'
                  }`,
                  filter: provider.active
                    ? 'drop-shadow(0px 0px 12px #F0014F)'
                    : 'brightness(50%)',
                  '&:not(:first-of-type)': {
                    ml: '1.5rem',
                  },
                  '& div': {
                    width: 33,
                    height: 33,
                  },
                  overflow: 'hidden',
                }}
              >
                <TooltipWrapper title={provider?.name} placement={'top'}>
                  <ProviderIcon
                    provider={provider?.name}
                    width={33}
                    height={33}
                  />
                </TooltipWrapper>
              </Box>
            ))}
          </Stack>
          <Image
            src={'/assets/images/shared/vaultsSummary.svg'}
            alt="Vault strategy Image"
            height={128}
            width={88}
            style={{
              zIndex: 2,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '-50%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '480px',
              height: '174px',
              background: 'linear-gradient(92.29deg, #FE3477 0%, #F0014F 100%)',
              opacity: 0.3,
              filter: 'blur(66px)',
              zIndex: 1,
            }}
          />
        </Stack>
        <Stack p="1.5rem">
          <Typography variant="body2">
            Automatic interest rates optimization
          </Typography>
          <Typography variant="body">
            {
              'The vault aims to maximize the returns on its assets by seeking the highest yields available from the list of aggregated lending protocols. This strategy is best for users who are "Lenders-only". Whenever they need to borrow against their provided assets, they can switch from a lending to a borrowing vault (the migration tool will be available soon).'
            }
          </Typography>
          <Box
            sx={{
              p: '0.75rem 1rem',
              backgroundColor: palette.secondary.main,
              mt: 2,
              borderRadius: '6px',
            }}
          >
            <Typography variant="body">
              {
                "💡️ It's important to note that each vault aggregates its own set of lending/borrowing protocols. The protocols illustrated above may vary from one vault to another."
              }
            </Typography>
          </Box>
        </Stack>
      </Card>
    </>
  );
}

export default VaultStrategy;
