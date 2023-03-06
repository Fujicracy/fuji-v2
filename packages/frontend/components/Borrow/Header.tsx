import { Divider, Typography, Stack } from "@mui/material"
import { ActionType } from "../../helpers/borrow"
import { NetworkIcon } from "../Shared/Icons"
import TabChip from "../Shared/TabChip"

type BorrowHeaderProps = {
  isEditing: boolean
  actionType: ActionType
  chainName: string
  onActionTypeChange: (action: ActionType) => void
}

function BorrowHeader({
  isEditing,
  actionType,
  chainName,
  onActionTypeChange,
}: BorrowHeaderProps) {
  return (
    <>
      {isEditing ? (
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
      {isEditing && (
        <Stack
          direction="row"
          sx={{
            marginTop: 3,
            marginBottom: 3,
          }}
        >
          {[ActionType.ADD, ActionType.REMOVE].map((p) => (
            <TabChip
              key={`${p}`}
              sx={p === ActionType.REMOVE ? { marginLeft: 1 } : {}}
              selected={actionType === p}
              label={`${p === ActionType.ADD ? "Add" : "Remove"} Position`}
              onClick={() => {
                onActionTypeChange(p)
              }}
            />
          ))}
        </Stack>
      )}
    </>
  )
}

export default BorrowHeader
