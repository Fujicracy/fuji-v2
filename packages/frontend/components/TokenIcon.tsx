import { Token } from "@x-fuji/sdk"
import Image, { ImageProps } from "next/image"
import { useEffect, useState } from "react"

interface Props extends Omit<ImageProps, "src"> {
  token: Token
}
export default function TokenIcon(props: Props) {
  const path = `/assets/images/protocol-icons/tokens/${props.token.symbol}.svg`

  const [error, setError] = useState<any>()
  useEffect(() => {
    if (error)
      console.error(
        `404 Not found. No image found for toke ${props.token.symbol}. Searched in ${path}"`
      )
  }, [error])

  if (error) {
    return <></> // TODO: Is it fine to fallback to not displaying anything ?
  }
  return (
    <Image
      {...props}
      src={path}
      alt={`${props.token.name} icon`}
      onError={(e) => setError(e)}
    />
  )
}
