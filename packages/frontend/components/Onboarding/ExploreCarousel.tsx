import { useState } from "react"
import { Grid, Box, Typography, Paper, Dialog, Button } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { useAuth } from "../../store/auth.store"
import Image from "next/image"

function ExploreCarousel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { palette } = useTheme()
  const [currentSlide, setCurrentSlide] = useState(1)
  const setExploreInfoSkipped = useAuth((state) => state.setExploreInfoSkipped)

  const slides = [
    {
      id: 1,
      image: "/assets/images/onboarding/onboarding_1.svg",
      title: "Welcome To Fuji Finance",
      text: "Optimize yield on your lend & borrow position.",
    },
    {
      id: 2,
      image: "/assets/images/onboarding/onboarding_2.svg",
      title: "Money Market Aggregator",
      text: "Aggregating the best money market rates for you and potentially saving you up to 40% per year on refinance costs.",
    },
    {
      id: 3,
      image: "/assets/images/onboarding/onboarding_3.svg",
      title: "Cross-Chain Lending And Borrowing",
      text: "Select your desired collateral and borrow assets pairs; Fuji will scan and provide you the best rate available in the market.",
    },
  ]

  const handleNextSlide = () => {
    setCurrentSlide(currentSlide + 1)
  }

  const next = () => {
    if (currentSlide === 3) {
      setExploreInfoSkipped(false)
      onClose()
    }

    handleNextSlide()
  }

  const skip = () => {
    setExploreInfoSkipped(true)
    onClose()
  }

  return (
    <Dialog open={open}>
      <Paper
        variant="outlined"
        sx={{
          maxWidth: "30rem",
          p: { xs: "1rem", sm: "1.5rem" },
          textAlign: "center",
        }}
      >
        <Grid container>
          {slides.map((slide) => (
            <Grid
              key={slide.id}
              item
              display={slide.id !== currentSlide ? "none" : "block"}
            >
              <Box color="white" textAlign="center">
                <Box maxWidth={432} maxHeight={240}>
                  <img
                    src={slide.image}
                    alt="Onboarding Image"
                    style={{ width: "100%", height: "auto" }}
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
                    fontSize: "0.875rem",
                    minHeight: "2.625rem",
                  }}
                >
                  {slide.text}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Button
          variant="gradient"
          size="large"
          onClick={next}
          fullWidth
          data-cy="safety-notice-accept"
        >
          {currentSlide !== 3 ? "Next" : "Finish"}
        </Button>

        <Typography
          sx={{
            m: "1.25rem 0",
            textDecoration: "underline",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
          onClick={skip}
        >
          Skip, I Will Explore On My Own
        </Typography>

        <Grid
          container
          sx={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          {slides.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor:
                  index === currentSlide - 1
                    ? palette.text.primary
                    : palette.secondary.light,
                m: "0 0.25rem",
                cursor: "pointer",
              }}
              onClick={() => setCurrentSlide(index + 1)}
            />
          ))}
        </Grid>
      </Paper>
    </Dialog>
  )
}

export default ExploreCarousel
