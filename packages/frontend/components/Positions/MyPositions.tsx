import { useState } from "react"
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

import { PositionSummary } from "./PositionSummary"
import { PositionsBorrowTable } from "./PositionBorrowTable"

function MyPositions() {
  const { breakpoints } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down("sm"))

  const [currentTab, setCurrentTab] = useState(0)
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setCurrentTab(newValue)

  const loading = usePositions((state) => state.loading)

  return (
    <>
      <Typography variant="h4" mb={1}>
        My Positions
      </Typography>
      <Typography variant="body">
        Fuji manages your borrowing and lending positions for maximum capital
        efficiency
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
