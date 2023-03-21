import React from "react"
import { Card, Chip, Grid, Typography, useTheme } from "@mui/material"
import { Stack } from "@mui/system"
import { liquidationColor } from "../../../../helpers/positions"

type SummaryCardItemProps = {
  title: string
  amount: string
  footer: string
  value?: number
  extra?: string | number
  isMobile: boolean
}

function SummaryCardItem({
  title,
  amount,
  footer,
  value,
  extra,
  isMobile,
}: SummaryCardItemProps) {
  const { palette } = useTheme()

  if (isMobile) {
    const shouldHaveParenthesis = title !== "Current Price"
    const content = `${amount} ${shouldHaveParenthesis ? "(" : ""}${footer}${
      shouldHaveParenthesis ? ")" : ""
    }`

    return (
      <Grid item sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="smallDark">{title}</Typography>
        <Typography variant="small" sx={{ textAlign: "right" }}>
          {content}
        </Typography>
      </Grid>
    )
  }
  return (
    <Grid item xs={6}>
      <Card variant="position">
        <Typography variant="smallDark">{title}</Typography>
        <Stack
          direction="row"
          alignItems="right"
          justifyContent={"center-vertical"}
          sx={{ textAlign: "right" }}
        >
          <Typography variant="regularH4" mb="0.5rem">
            {amount}
          </Typography>
          {extra && (
            <Chip
              sx={{ marginLeft: "0.5rem" }}
              label={`${extra} after`}
              variant={"currency"}
            />
          )}
        </Stack>
        {footer && footer.includes("below current price") ? (
          <Typography
            variant="smallDark"
            mb="1rem"
            sx={{
              color: value
                ? liquidationColor(value, palette)
                : palette.info.dark,
            }}
          >
            {footer.split("below current price")[0]}
            <Typography variant="smallDark" mb="1rem">
              {footer.split("%")[1]}
            </Typography>
          </Typography>
        ) : (
          <Typography variant="smallDark" mb="1rem">
            {footer}
          </Typography>
        )}
      </Card>
    </Grid>
  )
}

export default SummaryCardItem

SummaryCardItem.defaultProps = {
  extra: undefined,
  value: undefined,
}
