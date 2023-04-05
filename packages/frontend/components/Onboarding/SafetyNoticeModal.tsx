import {
  Box,
  Button,
  Checkbox,
  Dialog,
  FormControlLabel,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ChangeEvent, useEffect, useState } from 'react';

import { useAuth } from '../../store/auth.store';
import ExploreCarousel from './ExploreCarousel';

export function SafetyNoticeModal() {
  const { palette } = useTheme();

  const acceptTermsOfUse = useAuth((state) => state.acceptTermsOfUse);
  const getOnboardStatus = useAuth((state) => state.getOnboardStatus);

  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(true);
  const [hasPreviouslyAcceptedTerms, setHasPreviouslyAcceptedTerms] =
    useState<boolean>(true);
  const [isExploreModalShown, setIsExploreModalShown] =
    useState<boolean>(false);

  useEffect(() => {
    const hasPreviouslyAcceptedTerms = (): boolean =>
      getOnboardStatus().hasAcceptedTerms;

    setHasAcceptedTerms(hasPreviouslyAcceptedTerms);
    setHasPreviouslyAcceptedTerms(hasPreviouslyAcceptedTerms);
  }, [getOnboardStatus]);

  const onAcceptClick = () => {
    acceptTermsOfUse();
    setIsExploreModalShown(true);
  };

  const finishOnboarding = () => {
    setHasPreviouslyAcceptedTerms(true);
    setIsExploreModalShown(false);
  };

  return !isExploreModalShown ? (
    <Dialog open={!hasPreviouslyAcceptedTerms}>
      <Paper
        variant="outlined"
        sx={{
          maxWidth: '30rem',
          p: { xs: '1rem', sm: '1.5rem' },
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" color={palette.text.primary}>
          Safety Notice
        </Typography>

        <Typography mt="1rem" textAlign="start" sx={{ fontSize: '0.875rem' }}>
          Please be advised that the current version of the contracts is
          partially audited by Trail of Bits and Securing. Do your own research
          and use at your own risk!
        </Typography>

        <Box mt="1.5rem" sx={{ display: 'flex', flexDirection: 'row' }}>
          <FormControlLabel
            label={
              <Typography
                variant="small"
                sx={{ textAlign: 'start', fontSize: '0.875rem' }}
              >
                By checking this box and moving forward, you irrevocably accept
                our{' '}
                <Link
                  href="https://docs.fujidao.org/legals/terms-of-use"
                  target="blank"
                  underline="always"
                  variant="inherit"
                  sx={{ textDecoration: 'underline' }}
                >
                  Terms of use
                </Link>{' '}
                and confirm that you understand the risks described within.
              </Typography>
            }
            control={
              <Checkbox
                checked={hasAcceptedTerms}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setHasAcceptedTerms(event.target.checked);
                }}
                color="default"
                sx={{ p: '0 0.5rem 0 0' }}
              />
            }
            sx={{ alignItems: 'start', m: 0 }}
          />
        </Box>

        <Button
          variant="gradient"
          size="large"
          onClick={onAcceptClick}
          disabled={!hasAcceptedTerms}
          fullWidth
          data-cy="safety-notice-accept"
          sx={{ mt: '1.5rem' }}
        >
          Accept
        </Button>
      </Paper>
    </Dialog>
  ) : (
    <ExploreCarousel open={isExploreModalShown} onClose={finishOnboarding} />
  );
}

export default SafetyNoticeModal;
