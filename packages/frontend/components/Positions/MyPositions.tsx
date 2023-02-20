import { useEffect, useState } from "react"
import {
  Typography,
  Chip,
  Stack,
  Box,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
} from "@mui/material"

import { usePositions } from "../../store/positions.store"
import { useAuth } from "../../store/auth.store"

import { PositionSummary } from "./PositionSummary"
import { PositionsBorrowTable } from "./PositionBorrowTable"

function MyPositions() {
  const { breakpoints } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down("sm"))

  const [currentTab, setCurrentTab] = useState(0)
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) =>
    setCurrentTab(newValue)

  const address = useAuth((state) => state.address)
  const fetchPositions = usePositions((state) => state.fetchUserPositions)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address) {
      setLoading(true)
      ;(async () => {
        await fetchPositions()
        setLoading(false)
      })()
    }
  }, [address, fetchPositions])

  return (
    <>
      <Typography variant="h4" mb={1}>
        My Positions
      </Typography>
      <Typography variant="body">
        The protocol manage your borrowing and lending position for maximum
        capital efficiency
      </Typography>
      <PositionSummary />
      <Box mt={2} mb={3}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant={isMobile ? "fullWidth" : "standard"}
        >
          <Tab label="Borrowing" />
          <Tab
            disabled
            label={
              <Stack direction="row" alignItems="center" gap={1}>
                Lending
                {!isMobile && (
                  <Chip
                    variant="gradient"
                    label="Coming soon"
                    sx={{ cursor: "pointer" }}
                  />
                )}
              </Stack>
            }
          />
        </Tabs>
      </Box>
      {currentTab === 0 && <PositionsBorrowTable loading={loading} />}
    </>
  )
}

export default MyPositions
