import { Button, Card, TextField, Typography, useTheme } from "@mui/material"
import Image from "next/image"
import { useState } from "react"

export default function Lending() {
  const { palette } = useTheme()
  const [email, setEmail] = useState("")

  return (
    <Card variant="lending" sx={{ p: { xs: "1rem", sm: "3.75rem 27.5rem" } }}>
      <Image
        src="/assets/images/logo/himalaya.svg"
        alt="Logo Himalaya"
        width={64}
        height={64}
        style={{
          background: palette.secondary.dark,
          borderRadius: "100%",
        }}
      />
      <Typography variant="h4" mt="1.375rem">
        Himalaya Lend
      </Typography>
      <Typography
        color={palette.info.main}
        variant="small"
        m="1rem"
        sx={{ width: { xs: "100%", sm: "22.5rem" } }}
      >
        Retail and insituition lending interest rate optimization. Be the first
        to use our beta platform
      </Typography>

      <TextField
        id="email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        sx={{ mb: "1rem" }}
      />

      <Button variant="gradient" fullWidth>
        Join waitlist
      </Button>
    </Card>
  )
}
