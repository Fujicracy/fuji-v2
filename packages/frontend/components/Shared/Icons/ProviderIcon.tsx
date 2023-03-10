import { useTheme } from "@mui/material"
import { SyntheticEvent, useState } from "react"
import { getProviderImage } from "../../../helpers/paths"
import { Icon, renderIcon, renderIconError } from "./Base/Icon"

interface Props extends Icon {
  providerName: string
}

const defaultImage = "/assets/images/protocol-icons/providers/Aave%20V3.svg"

function ProviderIcon(props: Props) {
  const { palette } = useTheme()
  const { providerName } = props
  const path = getProviderImage(providerName)
  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>()

  if (error) {
    return renderIconError(props, palette)
  }
  return renderIcon(
    props,
    path,
    providerName,
    (e) => setError(e),
    error ? defaultImage : undefined
  )
}

export default ProviderIcon
