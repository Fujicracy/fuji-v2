import { Token } from "@x-fuji/sdk"
import Image, { ImageProps } from "next/image"
import { useEffect, useState } from "react"

interface Props extends Omit<ImageProps, "src"> {
  token: Token
}
export default function TokenIcon(props: Props) {
  const path = `/assets/images/protocol-icons/tokens/${props.token.symbol}.svg`
  const { token, ...rest } = props

  const [error, setError] = useState<any>()
  useEffect(() => {
    if (error)
      console.error(
        `404 Not found. No image found for toke ${token.symbol}. Searched in ${path}"`
      )
  }, [error])

  if (error) {
    return <></> // TODO: Is it fine to fallback to not displaying anything ?
  }
  return (
    <Image
      {...rest}
      src={path}
      alt={`${token.name} icon`}
      onError={(e) => setError(e)}
    />
  )
}
