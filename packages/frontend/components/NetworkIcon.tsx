import { ChainId } from "@x-fuji/sdk"
import Image, { ImageProps } from "next/image"
import { SyntheticEvent, useEffect, useState } from "react"
import { chains } from "../store/auth.slice"

interface Props extends Omit<ImageProps, "src"> {
  network: string | ChainId
}
export default function NetworkIcon(props: Props) {
  const { network, ...rest } = props

  let name: string | undefined
  if (typeof network === "string") {
    name = network
  } else {
    const chain = chains.find((c) => parseInt(c.id) === network)
    name = chain?.label
  }
  const path = `/assets/images/protocol-icons/networks/${name}.svg`

  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>()
  useEffect(() => {
    if (error)
      console.error(
        `404 Not found. No image found for network ${name}. Searched in ${path}`
      )
  }, [error, network, path, name])

  if (error) {
    return <></> // TODO: Is it fine to fallback to not displaying anything ?
  }
  return (
    <Image
      {...rest}
      src={path}
      alt={`${name} icon`}
      onError={(e) => setError(e)}
    />
  )
}
