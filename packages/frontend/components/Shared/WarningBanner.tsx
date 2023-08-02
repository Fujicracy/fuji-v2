import { Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import CloseButton from './CloseButton';

function WarningBanner({
  text,
  onClose,
}: {
  text: string;
  onClose: () => void;
}) {
  const { palette } = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      sx={{
        width: '100%',
        p: 1,
        backgroundColor: palette.secondary.dark,
        borderRadius: '6px',
      }}
    >
      <Typography variant="small" sx={{ maxWidth: '90%', ml: 0.5 }}>
        {text}
      </Typography>
      <CloseButton onClose={onClose} dimensionSize={18} />
    </Stack>
  );
}

export default WarningBanner;
