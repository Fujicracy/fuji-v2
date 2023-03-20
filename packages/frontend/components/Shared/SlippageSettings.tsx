import React, { useEffect, useRef, useState } from "react"
import {
  Box,
  Button,
  Card,
  Divider,
  Menu,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import { useBorrow } from "../../store/borrow.store"
import { colorTheme } from "../../styles/theme"
import { DEFAULT_SLIPPAGE } from "../../constants/borrow"
import Image from "next/image"

const slippageDefaultOptions: {
  value: number
  label: string
}[] = [
  { value: 100, label: "1%" },
  { value: 50, label: "0.5%" },
  { value: DEFAULT_SLIPPAGE, label: "0.3%" },
]

function SlippageSettings() {
  const { palette } = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [slippageInput, setSlippageInput] = useState<string>("")
  const isOpen = Boolean(anchorEl)
  const textInput = useRef<HTMLInputElement>(null)
  const slippage = useBorrow((state) => state.slippage)
  const changeSlippageValue = useBorrow((state) => state.changeSlippageValue)

  const openMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget)
  }
  const closeMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    setAnchorEl(null)
  }

  useEffect(() => {
    // setTimeout here to give time for input ref to setup
    setTimeout(() => {
      if (textInput.current) {
        if ([DEFAULT_SLIPPAGE, 50, 100].includes(slippage)) {
          setSlippageInput("")
          textInput?.current?.blur()
        } else {
          textInput?.current?.focus()
        }
      }
    }, 0)
  }, [textInput.current])

  const handlePercentageChange = (
    event: React.FocusEvent<HTMLInputElement>
  ) => {
    const enteredValue = parseFloat(event?.target?.value)

    // handles input more than 100 and sets it to max
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
      setSlippageInput(String(slippage / 100))
    }
  }

  const onButtonClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    value: number
  ) => {
    event.stopPropagation()
    changeSlippageValue(value)
    setSlippageInput("")
    textInput?.current?.blur()
  }

  // Keeps focus on input when user click on menu wrapper and something different from default values is set.
  const handleNonfunctionalClick = () => {
    if (![DEFAULT_SLIPPAGE, 50, 100].includes(slippage)) {
      textInput?.current?.focus()
    }
  }

  return (
    <>
      <Card
        variant="position"
        onClick={openMenu}
        sx={{
          display: "flex",
          p: "0.6rem",
          m: "0",
          maxWidth: "2.45rem",
          border: `1.23px solid ${
            anchorEl ? colorTheme.palette.text.primary : "transparent"
          }`,
          borderRadius: "6px",
        }}
      >
        <Image
          src={"/assets/images/shared/settings.svg"}
          alt="Settings Image"
          width={18}
          height={18}
        />
      </Card>
      <Menu
        id="slippage-settings"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={closeMenu}
        onClick={handleNonfunctionalClick}
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
                onClick={(e) => onButtonClick(e, option.value)}
              >
                {option.label}
              </Button>
            ))}
            <TextField
              label="Custom %"
              type="number"
              variant="outlined"
              inputRef={textInput}
              sx={{
                minWidth: "6.2rem",
                background: "transparent",
                "& .MuiInputBase-input": {
                  p: "0.6rem 1rem",
                },
                "& .MuiInputLabel-root:not(.MuiInputLabel-shrink)": {
                  transform: "translate(13px, 10px) scale(1)",
                },
                "& .MuiFormLabel-root.Mui-focused": {
                  color: `${colorTheme.palette.text.primary}`,
                },
                "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderWidth: "1px !important",
                  borderColor: `${colorTheme.palette.text.primary} !important`,
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
