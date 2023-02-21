import Image, { ImageProps } from "next/image"
import { SyntheticEvent, useEffect, useState } from "react"
import { getProviderImage } from "../../../helpers/paths"

interface Props extends Omit<ImageProps, "src"> {
  providerName: string
  sx?: object
}
const defaultImage = "/assets/images/protocol-icons/providers/Aave V3.svg"

export default function ProviderIcon(props: Props) {
  const { providerName, ...rest } = props
  const path = getProviderImage(providerName)

  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>()
  useEffect(() => {
    if (error)
      console.warn(
        `404 Not found. No image found for network ${providerName}. Searched in ${path}`
      )
  }, [error, path, providerName])

  return (
    <>
      {props.sx ? (
        <div style={props.sx}>
          <Image
            {...rest}
            src={error ? defaultImage : path}
            alt={`${providerName} icon`}
            onError={(e) => setError(e)}
          />
        </div>
      ) : (
        <Image
          {...rest}
          src={error ? defaultImage : path}
          alt={`${providerName} icon`}
          onError={(e) => setError(e)}
        />
      )}
    </>
  )
}
