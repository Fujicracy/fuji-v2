import React, { useState } from "react"
import {
  Box,
  Button,
  Divider,
  Menu,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material"
import Chip from "@mui/material/Chip"
import SettingsIcon from "@mui/icons-material/Settings"
import CloseIcon from "@mui/icons-material/Close"
import { useBorrow } from "../../store/borrow.store"

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
  const [slippageInput, setSlippageInput] = useState<string>("")
  const isOpen = Boolean(anchorEl)
  const slippage = useBorrow((state) => state.slippage)
  const changeSlippageValue = useBorrow((state) => state.changeSlippageValue)

  const openMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
    setAnchorEl(event.currentTarget)
  const closeMenu = () => setAnchorEl(null)

  const handlePercentageChange = (
    event: React.FocusEvent<HTMLInputElement>
  ) => {
    const enteredValue = parseFloat(event?.target?.value)

    if (enteredValue > 100) {
      setSlippageInput("100")
      changeSlippageValue(10000)

      return
    }

    changeSlippageValue(enteredValue * 100)
    setSlippageInput(event?.target?.value)
  }

  const onInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (event.target.value === "") {
      event.target.value = String(slippage)
      setSlippageInput(String(slippage / 100))
    }
  }

  const onButtonClick = (value: number) => {
    changeSlippageValue(value)
    setSlippageInput("")
  }

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
        <Box sx={{ maxWidth: "22rem", p: "1rem" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="start"
            height="30px"
          >
            <Typography variant="body2">Settings</Typography>
            <Box sx={{ cursor: "pointer" }} onClick={closeMenu}>
              <CloseIcon />
            </Box>
          </Stack>

          <Divider sx={{ m: "1rem 0" }} />

          <Typography
            variant="h6"
            sx={{ fontSize: "0.875rem" }}
            lineHeight="22px"
          >
            Slippage Tolerance
          </Typography>

          <Typography sx={{ fontSize: "0.75rem" }} variant="small">
            Your transaction will revert if the price changes unfavorably by
            more than this percentage
          </Typography>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            height="40px"
            mt="1rem"
            gap="0.3rem"
          >
            {slippageDefaultOptions.map((option) => (
              <Button
                size="medium"
                variant={
                  slippage === option.value ? "white-outlined" : "secondary"
                }
                key={option.label}
                fullWidth
                onClick={() => onButtonClick(option.value)}
              >
                {option.label}
              </Button>
            ))}
            <TextField
              label="Custom %"
              type="number"
              inputProps={{
                min: 0,
                max: 100,
                step: 0.01,
              }}
              sx={{
                minWidth: "6.2rem",
                background: "transparent",
                "& .MuiInputBase-input": {
                  p: "0.6rem 1rem",
                },
                "& .MuiInputLabel-root:not(.MuiInputLabel-shrink)": {
                  transform: "translate(13px, 10px) scale(1)",
                },
              }}
              onChange={handlePercentageChange}
              onFocus={onInputFocus}
              value={slippageInput}
            />
          </Stack>
        </Box>
      </Menu>
    </>
  )
}

export default SlippageSettings
