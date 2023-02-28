import { ChangeEvent, useEffect, useState } from "react"
import {
  Button,
  Typography,
  Box,
  Dialog,
  Paper,
  Link,
  FormControlLabel,
  Checkbox,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import ExploreCarousel from "./ExploreCarousel"

import { useAuth } from "../../store/auth.store"

export function SafetyNoticeModal() {
  const { palette } = useTheme()

  const acceptTermsOfUse = useAuth((state) => state.acceptTermsOfUse)
  const getOnboardStatus = useAuth((state) => state.getOnboardStatus)

  const [isTermsAccepted, setIsTermsAccepted] = useState<boolean>(true)
  const [isPreviouslyAccepted, setIsPreviouslyAccepted] =
    useState<boolean>(true)
  const [isExploreModalShown, setIsExploreModalShown] = useState<boolean>(false)

  useEffect(() => {
    const isPreviouslyAccepted = (): boolean =>
      getOnboardStatus().isTermsAccepted

    setIsTermsAccepted(isPreviouslyAccepted)
    setIsPreviouslyAccepted(isPreviouslyAccepted)
  }, [getOnboardStatus])

  const onAcceptClick = () => {
    acceptTermsOfUse()
    setIsExploreModalShown(true)
  }

  const finishOnboarding = () => {
    setIsPreviouslyAccepted(true)
    setIsExploreModalShown(false)
  }

  return !isExploreModalShown ? (
    <Dialog open={!isPreviouslyAccepted}>
      <Paper
        variant="outlined"
        sx={{
          maxWidth: "30rem",
          p: { xs: "1rem", sm: "1.5rem" },
          textAlign: "center",
        }}
      >
        <Typography variant="h5" color={palette.text.primary}>
          Safety Notice
        </Typography>

        <Typography mt="1rem" textAlign="start" sx={{ fontSize: "0.875rem" }}>
          Please be advised that the current version of the contracts is
          partially audited by Trail of Bits and Securing. Do your own research
          and use at your own risk!
        </Typography>

        <Box mt="1.5rem" sx={{ display: "flex", flexDirection: "row" }}>
          <FormControlLabel
            label={
              <Typography
                variant="small"
                sx={{ textAlign: "start", fontSize: "0.875rem" }}
              >
                By checking this box and moving forward, you irrevocably accept
                our{" "}
                <Link
                  href="https://docs.fujidao.org/legals/terms-of-use"
                  target="blank"
                  underline="always"
                  variant="inherit"
                  sx={{ textDecoration: "underline" }}
                >
                  Terms of use
                </Link>{" "}
                and confirm that you understand the risks described within.
              </Typography>
            }
            control={
              <Checkbox
                checked={isTermsAccepted}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setIsTermsAccepted(event.target.checked)
                }}
                color="default"
                sx={{ p: "0 0.5rem 0 0" }}
              />
            }
            sx={{ alignItems: "start", m: 0 }}
          />
        </Box>

        <Button
          variant="gradient"
          size="large"
          onClick={onAcceptClick}
          disabled={!isTermsAccepted}
          fullWidth
          data-cy="safety-notice-accept"
          sx={{ mt: "1.5rem" }}
        >
          Accept
        </Button>
      </Paper>
    </Dialog>
  ) : (
    <ExploreCarousel open={isExploreModalShown} onClose={finishOnboarding} />
  )
}

export default SafetyNoticeModal
