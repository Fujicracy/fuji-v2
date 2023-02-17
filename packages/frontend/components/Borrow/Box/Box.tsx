import { Box } from "@mui/material"

import { ChainSelect } from "./ChainSelect"
import TokenCard from "./TokenCard"

type BorrowBoxProps = {
  managePosition: boolean
  mb?: string | number | undefined
  label: string
  type: "borrow" | "collateral"
  chainId: string
  disableChainChange: boolean
  onChainChange: (chainId: string) => void
}

function BorrowBox(props: BorrowBoxProps) {
  return (
    <Box mb={props.mb}>
      <ChainSelect
        label={props.label}
        type={props.type}
        value={props.chainId}
        disabled={props.disableChainChange}
        onChange={(chainId) => props.onChainChange(chainId)}
      />
      <TokenCard
        type={props.type === "collateral" ? "collateral" : "debt"}
        disabled={props.managePosition}
      />
    </Box>
  )
}

export default BorrowBox
