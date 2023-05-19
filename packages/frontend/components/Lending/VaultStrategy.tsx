import { Card, Divider, Grid, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
      title: '3Vault received the deposits',
      text: '3The vault receives ETH from depositors and invests 100% of it to the highest APY available in the market',
    },
    {
      id: 3,
      image: '/assets/images/onboarding/onboarding_1.svg',
      title: '3Vault received the deposits',
      text: '3The vault receives ETH from depositors and invests 100% of it to the highest APY available in the market',
    },
  ];

  const handleNextSlide = (direction: Direction) => {
    const next =
      direction === Direction.Next ? currentSlide + 1 : currentSlide - 1;
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

      <Stack></Stack>
    </Card>
  );
}

export default VaultStrategy;
