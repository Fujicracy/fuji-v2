import { NextPage } from "next"
import Head from "next/head"
import {
  Box,
  Container,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
  Stack,
  Chip,
} from "@mui/material"

import Footer from "../components/Shared/Footer"
import Header from "../components/Shared/Header"
import { useState } from "react"

import { PositionSummary } from "../components/Positions/PositionSummary"
import { PositionsBorrowTable } from "../components/Positions/PositionBorrowTable"

const MyPositionPage: NextPage = () => {
  const { breakpoints, palette } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down("sm"))

  const [currentTab, setCurrentTab] = useState(0)
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) =>
    setCurrentTab(newValue)

  return (
    <>
      <Head>
        <title>My positions - Fuji-v2</title>
        <meta name="description" content="See and manage your open positions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <Container
        sx={{
          mt: { xs: "2rem", sm: "4rem" },
          mb: { xs: "7rem", sm: "0" },
          pl: { xs: "1rem", sm: "1rem" },
          pr: { xs: "1rem", sm: "1rem" },
          minHeight: "75vh",
        }}
      >
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
        {currentTab === 0 && <PositionsBorrowTable />}
      </Container>

      {!isMobile && <Footer />}
    </>
  )
}

export default MyPositionPage
