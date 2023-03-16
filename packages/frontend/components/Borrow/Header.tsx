import { Divider, Typography, Stack, Box } from "@mui/material"
import { ActionType } from "../../helpers/assets"
import { NetworkIcon } from "../Shared/Icons"
import TabChip from "../Shared/TabChip"
import TooltipWrapper from "../Shared/Tooltips/TooltipWrapper"

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
  const networkMessage = `Your position is currently on the ${chainName} Network`

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
          <TooltipWrapper
            defaultOpen
            placement="top"
            title={
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "10rem",
                }}
              >
                <Typography variant="small">{networkMessage}</Typography>
              </Box>
            }
          >
            <NetworkIcon network={chainName} height={18} width={18} />
          </TooltipWrapper>
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
