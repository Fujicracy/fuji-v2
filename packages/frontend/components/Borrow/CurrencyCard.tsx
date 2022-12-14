import React from "react"
import { Card, Stack, Typography } from "@mui/material"

type CurrencyCardProps = {
  title: string
  amount: string
  amountAfter?: string
  footer: string
}

export default function CurrencyCard(props: CurrencyCardProps) {
  const { title, amount, amountAfter, footer } = props

  return (
    <Card variant="currency">
      <Typography variant="smallDark">{title}</Typography>

      <Stack direction="row" alignItems="center" mb={0.5} mt={0.5} spacing={1}>
        <Typography variant="regularH4" display="inline">
          {amount}
        </Typography>
        {amountAfter && (
          <RoundedTypography>{amountAfter} after</RoundedTypography>
        )}
      </Stack>

      <Typography variant="smallDark" mb="1rem">
        {footer}
      </Typography>
    </Card>
  )
}

const RoundedTypography = (props: any) => {
  return (
    <Typography
      bgcolor="rgba(208, 218, 255, 0.25)"
      variant="small"
      p=".25rem .5rem"
      borderRadius="6.25rem"
    >
      {props.children}
    </Typography>
  )
}
