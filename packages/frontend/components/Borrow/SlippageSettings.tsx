import React, { useState } from "react"
import {
  Box,
  Button,
  Divider,
  Menu,
  Stack,
  Typography,
  useTheme,
} from "@mui/material"
import Chip from "@mui/material/Chip"
import SettingsIcon from "@mui/icons-material/Settings"
import CloseIcon from "@mui/icons-material/Close"

const defaultSlippage = 30

const slippageDefaultOptions: {
  value: number
  label: string
  selected: boolean
}[] = [
  { value: 100, label: "1%", selected: false },
  { value: 50, label: "0.5%", selected: false },
  { value: 30, label: "0.3%", selected: true },
]

function SlippageSettings() {
  const { palette } = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [slippage, setSlippage] = useState<number>(defaultSlippage)
  const isOpen = Boolean(anchorEl)

  const openMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
    setAnchorEl(event.currentTarget)
  const closeMenu = () => setAnchorEl(null)

  return (
    <>
      <Chip label={<SettingsIcon />} onClick={openMenu} />
      <Menu
        id="slippage-settings"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: 1 }}
        PaperProps={{ sx: { background: palette.secondary.contrastText } }}
      >
        <Box sx={{ minWidth: "21rem", p: "1rem" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            height="40px"
          >
            <Typography variant="body2">Settings</Typography>
            <Box sx={{ cursor: "pointer" }} onClick={closeMenu}>
              <CloseIcon />
            </Box>
          </Stack>
          <Divider sx={{ m: "1rem 0" }} />
          <Typography variant="h5">Slippage Tolerance</Typography>
          <Typography variant="body">
            Your transaction will revert if the price changes unfavorably by
            more than this percentage
          </Typography>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            height="40px"
            mt="1rem"
          >
            {slippageDefaultOptions.map((option) => (
              <Button
                variant={
                  slippage === option.value ? "white-outlined" : "secondary"
                }
                key={option.label}
                size="large"
                fullWidth
                onClick={() => setSlippage(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </Stack>
        </Box>
      </Menu>
    </>
  )
}

export default SlippageSettings
