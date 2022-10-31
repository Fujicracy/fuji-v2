import { useState } from "react"
import {
  Box,
  Chip,
  Grid,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material"
import MarketsTable from "./MarketsTable"
import Lending from "./Lending"
import { Chain, chains } from "../../store/auth.slice"
import Image from "next/image"
import SearchIcon from "@mui/icons-material/Search"

export default function Markets() {
  const { palette } = useTheme()
  const [currentTab, setCurrentTab] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  return (
    <div>
      <Typography variant="h4">X-Fuji Markets</Typography>
      <Typography variant="body">
        Fuji aggregates the best borrowing interest rates available across the
        markets
      </Typography>
      <Stack
        sx={{
          mt: "2.5rem",
          mb: "1.563rem",
        }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="Markets tabs"
            TabIndicatorProps={{ style: { background: palette.text.primary } }}
          >
            <Tab
              label="Borrowing"
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                color:
                  currentTab === 0 ? `${palette.text.primary} !important` : "",
              }}
            />
            <Tab
              label={
                <Grid>
                  Lending
                  <Chip
                    variant="gradient"
                    label="Coming soon"
                    sx={{ ml: "0.625rem" }}
                  />
                </Grid>
              }
              sx={{
                pl: "2rem",
                pr: "1rem",
                borderBottom: 1,
                borderColor: "divider",
                color:
                  currentTab === 1 ? `${palette.text.primary} !important` : "",
              }}
            />
          </Tabs>
        </Box>
        <Stack direction="row" gap="0.5rem" alignItems="center">
          <Typography
            variant="smallDark"
            color={palette.info.main}
            mr="0.25rem"
          >
            Filter Chains:
          </Typography>
          {chains.map((chain: Chain) => (
            <Image
              src={`/assets/images/protocol-icons/networks/${chain.label}.svg`}
              height={18}
              width={18}
              alt={chain.label}
              key={chain.id}
            />
          ))}
          <TextField
            id="filter"
            type="text"
            placeholder="Filter by token, protocol"
            //value={filterValue}
            //onChange={onFilterChange}
            variant="outlined"
            sx={{ ml: "1.063rem" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: palette.info.dark }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Stack>

      {currentTab === 0 && <MarketsTable />}

      {currentTab === 1 && <Lending />}
    </div>
  )
}
