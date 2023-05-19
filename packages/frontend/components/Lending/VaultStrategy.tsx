import { Card, Chip, Divider, Grid, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import React, { useState } from 'react';

enum Direction {
  Next,
  Previous,
}

function VaultStrategy() {
  const { palette } = useTheme();

  const [currentSlide, setCurrentSlide] = useState(1);

  const slides = [
    {
      id: 1,
      image: '/assets/images/onboarding/onboarding_1.svg',
      title: 'Vault received the deposits',
      text: 'The vault receives ETH from depositors and invests 100% of it to the highest APY available in the market',
    },
    {
      id: 2,
      image: '/assets/images/onboarding/onboarding_1.svg',
      title: '2Vault received the deposits',
      text: '2The vault receives ETH from depositors and invests 100% of it to the highest APY available in the market',
    },
    {
      id: 3,
      image: '/assets/images/onboarding/onboarding_1.svg',
      title: '3Vault received the deposits',
      text: '3The vault receives ETH from depositors and invests 100% of it to the highest APY available in the market',
    },
  ];

  const handleNextSlide = (direction: Direction) => {
    let next =
      direction === Direction.Next ? currentSlide + 1 : currentSlide - 1;
    next = Math.min(Math.max(next, 1), slides.length);

    setCurrentSlide(next);
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: '1.5rem',
        mt: '1.5rem',
      }}
    >
      <Typography variant="body2">Vault Strategy</Typography>

      <Divider sx={{ m: '1rem 0 1.5rem 0', width: '100%' }} />
      <Typography variant="body2">
        Automatic interest rates optimization
      </Typography>
      <Typography variant="body">
        Users who are “lenders only” will be proposed to invest in vaults that
        seek the highest yield for their assets. There will be vaults that seek
        the highest APY from a selected list of lending providers (Aave,
        Compound) and there will be vaults with more attractive APY coming from
        a list of yield farms or aggregators (Beefy, Yearn).
      </Typography>

      {slides.map((slide) => (
        <Grid
          mt="1.5rem"
          key={slide.id}
          item
          display={slide.id !== currentSlide ? 'none' : 'block'}
        >
          <img
            src={slide.image}
            alt="Vault strategy Image"
            style={{ width: '100%', height: 'auto' }}
          />
          <Typography variant="body2" mt="1.5rem" mb="1rem">
            {slide.title}
          </Typography>
          <Typography variant="body">{slide.text}</Typography>
        </Grid>
      ))}

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        sx={{ width: '100%', mt: '1.5rem' }}
      >
        <Chip
          label={
            <Image
              src={'/assets/images/shared/arrowBackWhite.svg'}
              alt={'Back arrow'}
              width={14}
              height={12}
            />
          }
          sx={{
            '& .MuiChip-label': {
              height: '12px',
            },
          }}
          onClick={() => handleNextSlide(Direction.Previous)}
        />
        <Grid
          container
          wrap="wrap"
          alignItems="center"
          justifyContent="center"
          gap={1}
          sx={{
            maxWidth: '14.25rem !important',
          }}
        >
          {slides.map((slide) => (
            <Grid
              item
              sm={2.75}
              key={`slide-button-${slide.id}`}
              sx={{
                height: '0.25rem',
                borderRadius: '100px',
                backgroundColor:
                  currentSlide === slide.id
                    ? palette.primary.main
                    : palette.secondary.main,
                maxWidth: '3rem !important',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor:
                    currentSlide === slide.id
                      ? palette.primary.main
                      : palette.secondary.light,
                },
              }}
              onClick={() => setCurrentSlide(slide.id)}
            />
          ))}
        </Grid>
        <Chip
          label={
            <Image
              src={'/assets/images/shared/arrowBackWhite.svg'}
              alt={'Back arrow'}
              width={14}
              height={12}
              style={{ transform: 'rotate(180deg)' }}
            />
          }
          sx={{
            '& .MuiChip-label': {
              height: '12px',
            },
          }}
          onClick={() => handleNextSlide(Direction.Next)}
        />
      </Stack>
    </Card>
  );
}

export default VaultStrategy;
