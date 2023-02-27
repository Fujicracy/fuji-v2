import React from "react"
import { Card, Chip, Typography, useTheme } from "@mui/material"
import { Stack } from "@mui/system"

type PositionCardProps = {
  title: string
  amount: string
  footer: string
  value?: number
  extra?: string | number
}

export default function PositionCard(props: PositionCardProps) {
  const { palette } = useTheme()

  const footerValue = Number(
    props.footer.includes("below current price")
      ? props.footer.split("below current price")[0]
      : ""
  )

  return (
    <Card variant="position">
      <Typography variant="smallDark">{props.title}</Typography>
      <Stack
        direction={"row"}
        alignItems="left"
        justifyContent={"center-vertical"}
      >
        <Typography variant="regularH4" mb="0.5rem">
          {props.amount}
        </Typography>
        {props.extra && (
          <Chip
            sx={{ marginLeft: "0.5rem" }}
            label={`${props.extra} after`}
            variant={"currency"}
          />
        )}
      </Stack>
      {props.footer && props.footer.includes("below current price") ? (
        <Typography
          variant="smallDark"
          mb="1rem"
          sx={{
            color: props.value
              ? props.value > 50 // TODO: use recommendedLTV?
                ? palette.success.main
                : palette.warning.main
              : palette.info.dark,
          }}
        >
          {props.footer.split("below current price")[0]}
          <Typography variant="smallDark" mb="1rem">
            {props.footer.split("%")[1]}
          </Typography>
        </Typography>
      ) : (
        <Typography variant="smallDark" mb="1rem">
          {props.footer}
        </Typography>
      )}
    </Card>
  )
}

PositionCard.defaultProps = {
  extra: undefined,
  value: undefined,
}
