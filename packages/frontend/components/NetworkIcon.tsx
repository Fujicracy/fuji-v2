import Image, { ImageProps } from "next/image"
import { SyntheticEvent, useEffect, useState } from "react"

interface Props extends Omit<ImageProps, "src"> {
  networkName: string
}
export default function NetworkIcon(props: Props) {
  const path = `/assets/images/protocol-icons/networks/${props.networkName}.svg`
  const { networkName, ...rest } = props

  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>()
  useEffect(() => {
    if (error)
      console.error(
        `404 Not found. No image found for network ${networkName}. Searched in ${path}`
      )
  }, [error, networkName, path])

  if (error) {
    return <></> // TODO: Is it fine to fallback to not displaying anything ?
  }
  return (
    <Image
      {...rest}
      src={path}
      alt={`${networkName} icon`}
      onError={(e) => setError(e)}
    />
  )
}
