import Image, { ImageProps } from "next/image"
import { SyntheticEvent, useEffect, useState } from "react"

interface Props extends Omit<ImageProps, "src"> {
  providerName: string
}
const defaultImage = "/assets/images/protocol-icons/providers/Aave V3.svg"

export default function ProviderIcon(props: Props) {
  const { providerName, ...rest } = props
  const path = `/assets/images/protocol-icons/providers/${providerName}.svg`

  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>()
  useEffect(() => {
    if (error)
      console.error(
        `404 Not found. No image found for network ${providerName}. Searched in ${path}`
      )
  }, [error, path, providerName])

  return (
    <Image
      {...rest}
      src={error ? defaultImage : path}
      alt={`${providerName} icon`}
      onError={(e) => setError(e)}
    />
  )
}
