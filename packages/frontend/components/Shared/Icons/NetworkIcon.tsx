import { useTheme } from "@mui/material"
import { ChainId } from "@x-fuji/sdk"
import { SyntheticEvent, useState } from "react"
import { getNetworkImage } from "../../../helpers/paths"
import { chainName, chainIcon } from "../../../services/chains"
import { Icon, renderIcon, renderIconError } from "./Base/Icon"

interface Props extends Icon {
  network: string | ChainId
}

export default function NetworkIcon(props: Props) {
  const { palette } = useTheme()
  const { network } = props
  const name = typeof network === "string" ? network : chainName(network)
  const path = getNetworkImage(chainIcon(name))
  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>()

  if (error) {
    return renderIconError(props, palette)
  }
  return renderIcon(props, path, name, (e) => setError(e))
}
