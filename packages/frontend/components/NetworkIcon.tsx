import { ConnectedChain } from "@web3-onboard/core"
import { Token } from "@x-fuji/sdk"
import Image, { ImageProps } from "next/image"
import { networkInterfaces } from "os"
import { useEffect, useState } from "react"

interface Props extends Omit<ImageProps, "src"> {
  networkName: string
}
export default function NetworkIcon(props: Props) {
  const path = `/assets/images/protocol-icons/networks/${props.networkName}.svg`

  const [error, setError] = useState<any>()
  useEffect(() => {
    if (error)
      console.error(
        `404 Not found. No image found for network ${props.networkName}. Searched in ${path}`
      )
  }, [error])

  if (error) {
    return <></> // TODO: Is it fine to fallback to not displaying anything ?
  }
  return (
    <Image
      {...props}
      src={path}
      alt={`${props.networkName} icon`}
      onError={(e) => setError(e)}
    />
  )
}
