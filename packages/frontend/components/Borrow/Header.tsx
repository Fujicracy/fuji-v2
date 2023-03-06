import { Divider, Typography, Stack } from "@mui/material"
import { PositionAction } from "../../helpers/borrow"
import { NetworkIcon } from "../Shared/Icons"
import TabChip from "../Shared/TabChip"

type BorrowHeaderProps = {
  isManagingPosition: boolean
  action: PositionAction
  chainName: string
  onPositionActionChange: (action: PositionAction) => void
}

function BorrowHeader({
  isManagingPosition,
  action,
  chainName,
  onPositionActionChange,
}: BorrowHeaderProps) {
  return (
    <>
      {isManagingPosition ? (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          height="40px"
        >
          <Typography variant="body2" height="40px" lineHeight="40px">
            Manage your position
          </Typography>
          <NetworkIcon network={chainName} height={18} width={18} />
        </Stack>
      ) : (
        <Typography variant="body2" height="40px" lineHeight="40px">
          Borrow
        </Typography>
      )}
      <Divider sx={{ mt: "1rem", mb: "0.5rem" }} />
      {isManagingPosition && (
        <Stack
          direction="row"
          sx={{
            marginTop: 3,
            marginBottom: 3,
          }}
        >
          {[PositionAction.ADD, PositionAction.REMOVE].map((p) => (
            <TabChip
              key={`${p}`}
              sx={p === PositionAction.REMOVE ? { marginLeft: 1 } : {}}
              selected={action === p}
              label={`${p === PositionAction.ADD ? "Add" : "Remove"} Position`}
              onClick={() => {
                onPositionActionChange(p)
              }}
            />
          ))}
        </Stack>
      )}
    </>
  )
}

export default BorrowHeader
