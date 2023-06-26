import { Chip, Stack, Tooltip } from '@mui/material';
import { Box } from '@mui/system';

import { ProviderIcon } from '../Icons';

type MarketsTableRowProps = {
  integratedProtocols: string[];
};

function IntegratedProtocols({ integratedProtocols }: MarketsTableRowProps) {
  return (
    <Stack
      direction="row"
      justifyContent="right"
      alignItems="center"
      flexWrap="nowrap"
      sx={{
        mr: integratedProtocols.length > 1 ? '-0.25rem' : '0',
      }}
    >
      {integratedProtocols.map((name, i) => (
        <Tooltip key={name} title={name} arrow>
          <Box
            sx={{
              position: 'relative',
              right: `${i * 0.25}rem`,
              zIndex: 4 - i,
              height: '24px',
            }}
          >
            {i <= 2 && <ProviderIcon provider={name} height={24} width={24} />}
          </Box>
        </Tooltip>
      ))}
      {integratedProtocols.length >= 4 && (
        <Chip
          label={
            <Stack direction="row" justifyContent="center">
              +{integratedProtocols.length - 3}
            </Stack>
          }
          variant="number"
        />
      )}
    </Stack>
  );
}

export default IntegratedProtocols;
