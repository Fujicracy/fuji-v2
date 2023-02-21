import React from "react"
import { Card, Chip, Typography } from "@mui/material"
import { Stack } from "@mui/system"

type CurrencyCardProps = {
  title: string
  amount: string
  footer: string
  extra: string | undefined
}

export default function CurrencyCard(props: CurrencyCardProps) {
  return (
    <Card variant="currency">
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
      <Typography variant="smallDark" mb="1rem">
        {props.footer}
      </Typography>
    </Card>
  )
}

CurrencyCard.defaultProps = {
  extra: undefined,
}
