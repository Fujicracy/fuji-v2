import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  useTheme,
} from "@mui/material"
import Image from "next/image"
import { useState } from "react"

export default function Lending() {
  const { palette } = useTheme()
  const [email, setEmail] = useState("")

  return (
    <Card variant="lending" sx={{ p: { xs: "1rem", sm: "3.75rem 27.5rem" } }}>
      <CardContent sx={{ width: "360px" }}>
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
        <Box mt={3}>
          <Typography variant="h4" mt={3}>
            Himalaya Lend
          </Typography>
        </Box>
        <Box mt={1}>
          <Typography color={palette.info.main} variant="small" mt={2}>
            Retail and insituition lending interest rate optimization. Be the
            first to use our beta platform
          </Typography>
        </Box>

        <Box mt={3}>
          <TextField
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
        </Box>

        <Box mt={2}>
          <Button variant="gradient" size="large" fullWidth>
            Join waitlist
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
