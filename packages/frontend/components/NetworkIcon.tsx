import { ChainId } from "@x-fuji/sdk"
import Image, { ImageProps } from "next/image"
import { SyntheticEvent, useEffect, useState } from "react"
import { chainName } from "../helpers/chainName"

interface Props extends Omit<ImageProps, "src"> {
  network: string | ChainId
  sx?: object
}

// TODO: Don't know which image put as default
const defaultImage = "/assets/images/protocol-icons/networks/Arbitrum.svg"

export default function NetworkIcon(props: Props) {
  const { network, ...rest } = props

  const name = typeof network === "string" ? network : chainName(network)
  const path = `/assets/images/protocol-icons/networks/${name}.svg`

  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>()
  useEffect(() => {
    if (error)
      console.error(
        `404 Not found. No image found for network ${name}. Searched in ${path}`
      )
  }, [error, network, path, name])

  return (
    <>
      {props.sx ? (
        <div style={props.sx}>
          <Image
            {...rest}
            src={error ? defaultImage : path}
            alt={`${name} icon`}
            onError={(e) => setError(e)}
          />
        </div>
      ) : (
        <Image
          {...rest}
          src={error ? defaultImage : path}
          alt={`${name} icon`}
          onError={(e) => setError(e)}
        />
      )}
    </>
  )
}
