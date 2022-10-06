import React from "react"
import { useTheme } from "@mui/material/styles"
import { Card, Typography } from "@mui/material"

declare interface CurrencyCardProps {
  informations: {
    title: string
    amount: string
    footer: string
  }
}

export default function CurrencyCard(props: CurrencyCardProps) {
  const theme = useTheme()

  return (
    <Card variant="currency">
      <Typography variant="smallDark">{props.informations.title}</Typography>

      <Typography variant="h4" mb="0.5rem">
        {props.informations.amount}
      </Typography>

      <Typography variant="smallDark">{props.informations.footer}</Typography>
    </Card>
  )
}
