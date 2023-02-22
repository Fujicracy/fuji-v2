import { Stack } from "@mui/material"
import TokenIcon from "./TokenIcon"
import NetworkIcon from "./NetworkIcon"
import { Token } from "@x-fuji/sdk"

type TokenWithNetworkIconProps = {
  token: string | Token
  network: string
  innertTop: string
}

export default function TokenWithNetworkIcon({
  token,
  network,
  innertTop,
}: TokenWithNetworkIconProps) {
  return (
    <Stack direction="row">
      <TokenIcon token={token} width={32} height={32} />
      <NetworkIcon
        network={network}
        height={16}
        width={16}
        sx={{
          position: "relative",
          right: "0.75rem",
          border: "0.5px solid white",
          borderRadius: "100%",
          height: "17px",
          width: "17px",
          top: innertTop,
        }}
      />
    </Stack>
  )
}

TokenWithNetworkIcon.defaultProps = {
  innertTop: "1.5rem",
}
