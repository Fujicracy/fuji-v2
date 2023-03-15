import React from "react"
import { Card, Chip, Grid, Typography, useTheme } from "@mui/material"
import { Stack } from "@mui/system"
import { liquidationColor } from "../../../helpers/positions"

type PositionCardProps = {
  title: string
  amount: string
  footer: string
  value?: number
  extra?: string | number
}

function PositionCardGradItem(props: PositionCardProps) {
  return (
    <Grid item xs={6}>
      <PositionCard
        title={props.title}
        amount={props.amount}
        footer={props.footer}
        extra={props.extra}
      />
    </Grid>
  )
}

export default PositionCardGradItem

function PositionCard({
  title,
  amount,
  footer,
  value,
  extra,
}: PositionCardProps) {
  const { palette } = useTheme()

  return (
    <Card variant="position">
      <Typography variant="smallDark">{title}</Typography>
      <Stack
        direction={"row"}
        alignItems="left"
        justifyContent={"center-vertical"}
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
            color: value ? liquidationColor(value, palette) : palette.info.dark,
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
  )
}

PositionCard.defaultProps = {
  extra: undefined,
  value: undefined,
}
