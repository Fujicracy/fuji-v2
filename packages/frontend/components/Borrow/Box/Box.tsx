import { Box } from "@mui/material"
import { AssetChange, LtvMeta, ActionType } from "../../../helpers/borrow"
import { useBorrow } from "../../../store/borrow.store"

import ChainSelect from "./ChainSelect"
import TokenCard from "./TokenCard"

type BorrowBoxProps = {
  isEditing: boolean
  actionType: ActionType
  type: "debt" | "collateral"
  chainId: string
  isExecuting: boolean
  value: string
  ltvMeta: LtvMeta
  assetChange: AssetChange
}

function BorrowBox({
  isEditing,
  actionType,
  assetChange,
  type,
  chainId,
  isExecuting,
  value,
  ltvMeta,
}: BorrowBoxProps) {
  const changeCollateralChain = useBorrow(
    (state) => state.changeCollateralChain
  )
  const changeCollateralToken = useBorrow(
    (state) => state.changeCollateralToken
  )
  const changeCollateralValue = useBorrow(
    (state) => state.changeCollateralValue
  )
  const changeDebtChain = useBorrow((state) => state.changeDebtChain)
  const changeDebtToken = useBorrow((state) => state.changeDebtToken)
  const changeDebtValue = useBorrow((state) => state.changeDebtValue)

  return (
    <Box mb={type === "collateral" ? "1rem" : undefined}>
      <ChainSelect
        label={
          type === "collateral"
            ? actionType === ActionType.ADD
              ? "Collateral from"
              : "Withdraw to"
            : actionType === ActionType.ADD
            ? "Borrow to"
            : "Payback from"
        }
        type={type}
        value={chainId}
        disabled={isEditing || isExecuting}
        onChange={(chainId) =>
          type === "collateral"
            ? changeCollateralChain(chainId)
            : changeDebtChain(chainId)
        }
      />
      <TokenCard
        type={type}
        assetChange={assetChange}
        actionType={actionType}
        disabled={isEditing}
        isExecuting={isExecuting}
        value={value}
        ltvMeta={ltvMeta}
        onTokenChange={(token) =>
          type === "collateral"
            ? changeCollateralToken(token)
            : changeDebtToken(token)
        }
        onInputChange={(value) =>
          type === "collateral"
            ? changeCollateralValue(value)
            : changeDebtValue(value)
        }
      />
    </Box>
  )
}

export default BorrowBox
