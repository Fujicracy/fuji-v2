import {
  Box,
  Button,
  Dialog,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';

import { getOnboardStatus, setExploreInfoShown } from '../../../helpers/auth';

function ExploreCarousel() {
  const { palette } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [hasPreviouslyExploreInfoShown, setHasPreviouslyExploreInfoShown] =
    useState<boolean>(true);

  useEffect(() => {
    const wasExploreInfoShown = getOnboardStatus().wasExploreInfoShown || false;

    setHasPreviouslyExploreInfoShown(wasExploreInfoShown);
  }, []);

  const slides = [
    {
      id: 1,
      image: '/assets/images/onboarding/onboarding_1.svg',
      title: 'Welcome To Fuji Finance',
      text: 'Optimize your DeFi lending and borrowing positions.',
    },
    {
      id: 2,
      image: '/assets/images/onboarding/onboarding_2.svg',
      title: 'Money Market Aggregator',
      text: 'Aggregating the best money markets for you and helping to save up to 40% per year on your borrow rates.',
    },
    {
      id: 3,
      image: '/assets/images/onboarding/onboarding_3.svg',
      title: 'Cross-Chain Lending And Borrowing',
      text: 'Select your collateral and borrow assets; Fuji scans the money markets and routes you to the best rates available.',
    },
  ];

  const handleNextSlide = () => {
    setCurrentSlide(currentSlide + 1);
  };

  const next = () => {
    if (currentSlide === 3) {
      setExploreInfoShown(true);
      setHasPreviouslyExploreInfoShown(true);
    }

    handleNextSlide();
  };

  const skip = () => {
    setExploreInfoShown(true);
    setHasPreviouslyExploreInfoShown(true);
  };

  return (
    <Dialog data-cy="explore-carousel" open={!hasPreviouslyExploreInfoShown}>
      <Paper
        variant="outlined"
        sx={{
          maxWidth: '30rem',
          p: { xs: '1rem', sm: '1.5rem' },
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          ['@media screen and (max-width: 414px)']: {
            minHeight: '33rem',
          },
        }}
      >
        <Grid container>
          {slides.map((slide) => (
            <Grid
              key={slide.id}
              item
              display={slide.id !== currentSlide ? 'none' : 'block'}
            >
              <Box color="white" textAlign="center">
                <Box maxWidth={432} maxHeight={240}>
                  <img
                    src={slide.image}
                    alt="Onboarding Image"
                    style={{ width: '100%', height: 'auto' }}
                  />
                </Box>

                <Typography
                  variant="h5"
                  mt="1.5rem"
                  color={palette.text.primary}
                >
                  {slide.title}
                </Typography>

                <Typography
                  mt="1.5rem"
                  mb="1.5rem"
                  sx={{
                    fontSize: '0.875rem',
                    minHeight: '2.625rem',
                  }}
                >
                  {slide.text}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Stack>
          <Button
            variant="gradient"
            size="large"
            onClick={next}
            fullWidth
            data-cy="safety-notice-accept"
          >
            {currentSlide !== 3 ? 'Next' : 'Finish'}
          </Button>

          <Typography
            data-cy={'skip-explore'}
            sx={{
              m: '1.25rem 0',
              textDecoration: 'underline',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
            onClick={skip}
          >
            Skip, I Will Explore On My Own
          </Typography>

          <Grid
            container
            sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            {slides.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor:
                    index === currentSlide - 1
                      ? palette.text.primary
                      : palette.secondary.light,
                  m: '0 0.25rem',
                  cursor: 'pointer',
                }}
                onClick={() => setCurrentSlide(index + 1)}
              />
            ))}
          </Grid>
        </Stack>
      </Paper>
    </Dialog>
  );
}

export default ExploreCarousel;
