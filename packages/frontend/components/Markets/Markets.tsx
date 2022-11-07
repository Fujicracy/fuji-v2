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
  const [filterValue, setFilterValue] = useState("")

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) =>
    setCurrentTab(newValue)

  return (
    <div>
      <Typography variant="h4">
        {currentTab === 0 ? "X-Fuji Markets" : "Lend"}
      </Typography>
      <Typography variant="body">
        {currentTab === 0 ? (
          "Fuji aggregates the best borrowing interest rates available across the markets"
        ) : (
          <span>
            Optimize your lending vaults for better yield
            <a href="#">
              {" "}
              {/* TODO: Asked to Ivan the link but waiting answer */}
              <u>learn more</u>
            </a>
          </span>
        )}
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

        {currentTab === 0 && (
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
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: palette.info.dark }} />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )}
      </Stack>

      {currentTab === 0 && <MarketsTable />}

      {currentTab === 1 && <Lending />}
    </div>
  )
}
