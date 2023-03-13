import React from "react"
import { Box, Tooltip, Typography, Link } from "@mui/material"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"

export default function Borrow() {
  return (
    <Box
      mb="1rem"
      sx={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <Typography variant="small">Why do I need to sign?</Typography>
      <Tooltip
        arrow
        placement="top"
        title={
          <Box
            sx={{ display: "flex", flexDirection: "column", width: "15rem" }}
          >
            <Typography
              variant="body2"
              sx={{ fontSize: "0.875rem" }}
              mb="0.5rem"
            >
              Signature
            </Typography>
            <Typography variant="xsmall">
              Before submitting the transaction, you need to sign a message to
              authorize the Fuji router contract to act on your behalf. You can
              learn more about it in
              <Link
                href="https://www.notion.so/Himalaya-Documentation-v0-1-0-7c8edb56e6764d00a66a184e48692bf9#8dba481d20604959aa69b2ab536e5788"
                target="_blank"
                rel="noreferrer"
                ml="0.25rem"
                sx={{ textDecoration: "underline" }}
              >
                our docs
              </Link>
            </Typography>
          </Box>
        }
      >
        <InfoOutlinedIcon
          sx={{
            ml: "0.313rem",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        />
      </Tooltip>
    </Box>
  )
}
