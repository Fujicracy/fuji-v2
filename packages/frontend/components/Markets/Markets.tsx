import { useState } from "react"
import {
  Box,
  Chip,
  Grid,
  Link,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import MarketsTable from "./MarketsTable"
import Lending from "./Lending"
import { theme } from "../../styles/theme"

function Markets() {
  const { palette } = useTheme()
  const onMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [currentTab, setCurrentTab] = useState(0)
  /* const [filterValue, setFilterValue] = useState("") */
  /* const [chainFilters, setChainFilters] = useState<Chain[]>([]) */

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setCurrentTab(newValue)

  return (
    <Box>
      <Typography variant="h4">Markets</Typography>
      <Typography variant="body">
        {currentTab === 0 || onMobile ? (
          "Fuji aggregates the best borrowing interest rates available across the markets"
        ) : (
          <span>
            Optimize your lending vaults for better yield
            <Link href="#">
              {" "}
              {/* TODO: Asked to Ivan the link but waiting answer */}
              <u>learn more</u>
            </Link>
          </span>
        )}
      </Typography>
      <Grid
        container
        mt="2.5rem"
        mb="1.563rem"
        justifyContent="space-between"
        alignItems="center"
        wrap="wrap"
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="Markets tabs"
          sx={{ width: { xs: "100%", sm: "auto" } }}
          TabIndicatorProps={{ sx: { background: palette.text.primary } }}
        >
          <Tab label="Borrowing" />
          <Tab
            label={
              <Grid container alignItems="center" gap={1}>
                Lending
                {!onMobile && (
                  <Chip
                    variant="gradient"
                    label="Coming soon"
                    sx={{ cursor: "pointer" }}
                  />
                )}
              </Grid>
            }
          />
        </Tabs>

        {/* {currentTab === 0 && (
          <Stack
            direction="row"
            gap="0.5rem"
            alignItems="center"
            flexWrap="wrap"
            mt="0.75rem"
          >
            <Typography
              variant="smallDark"
              color={palette.info.main}
              mr="0.25rem"
            >
              Filter Chains:
            </Typography>
            {chains.map((chain: Chain) => (
              <Tooltip arrow title={chain.label} placement="top" key={chain.id}>
                <Box
                  sx={{
                    borderRadius: "100%",
                    width: "1.125rem",
                    height: "1.125rem",
                    cursor: "pointer",
                    border: chainFilters.includes(chain)
                      ? `1px solid white`
                      : "",
                  }}
                >
                  <Image
                    src={`/assets/images/protocol-icons/networks/${chain.label}.svg`}
                    height={18}
                    width={18}
                    objectFit="cover"
                    alt={chain.label}
                    onClick={() => {
                      chainFilters.includes(chain)
                        ? setChainFilters(
                            chainFilters.filter((c) => c !== chain)
                          )
                        : setChainFilters([...chainFilters, chain])
                    }}
                  />
                </Box>
              </Tooltip>
            ))}
            <TextField
              id="filter"
              type="text"
              placeholder="Filter by token, protocol"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              variant="outlined"
              sx={{ ".MuiInputBase-input": { minWidth: "170px" } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: palette.info.dark }} />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        )} */}
      </Grid>

      {currentTab === 0 && <MarketsTable />}

      {currentTab === 1 && <Lending />}
    </Box>
  )
}

export default Markets
