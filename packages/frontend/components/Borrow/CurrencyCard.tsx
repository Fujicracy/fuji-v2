import React from "react"
import { Card, Typography } from "@mui/material"

type CurrencyCardProps = {
  informations: { title: string; amount: string; footer: string }
}

export default function CurrencyCard(props: CurrencyCardProps) {
  return (
    <Card variant="currency">
      <Typography variant="smallDark">{props.informations.title}</Typography>

      <Typography variant="regularH4" mb="0.5rem" sx={{ width: "16rem" }}>
        {props.informations.amount}
      </Typography>

      <Typography variant="smallDark" mb="1rem">
        {props.informations.footer}
      </Typography>
    </Card>
  )
}
