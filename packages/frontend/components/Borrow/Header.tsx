import { useState } from "react"
import { Divider, Typography, Stack } from "@mui/material"
import { NetworkIcon } from "../Shared/Icons"
import TabChip from "../Shared/TabChip"

type BorrowHeaderProps = {
  managePosition: boolean
  action: number
  chainName: string
  onPositionActionChange: (action: number) => void
}

function BorrowHeader(props: BorrowHeaderProps) {
  return (
    <>
      {props.managePosition ? (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          height="40px"
        >
          <Typography variant="body2" height="40px" lineHeight="40px">
            Manage your position
          </Typography>
          <NetworkIcon network={props.chainName} height={18} width={18} />
        </Stack>
      ) : (
        <Typography variant="body2" height="40px" lineHeight="40px">
          Borrow
        </Typography>
      )}
      <Divider sx={{ mt: "1rem", mb: "0.5rem" }} />
      {props.managePosition && (
        <Stack
          direction="row"
          sx={{
            marginTop: 3,
            marginBottom: 3,
          }}
        >
          <TabChip
            selected={props.action === 0}
            label={"Add Position"}
            onClick={() => {
              props.onPositionActionChange(0)
            }}
          />
          <TabChip
            selected={props.action === 1}
            label={"Remove Position"}
            sx={{ marginLeft: 1 }}
            onClick={() => {
              props.onPositionActionChange(1)
            }}
          />
        </Stack>
      )}
    </>
  )
}

export default BorrowHeader
