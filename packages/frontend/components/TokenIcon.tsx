import { Token } from "@x-fuji/sdk"
import Image, { ImageProps } from "next/image"
import { SyntheticEvent, useEffect, useState } from "react"

interface Props extends Omit<ImageProps, "src"> {
  token: Token | string
}

export const getTokenImage = (symbol: string) =>
  `/assets/images/protocol-icons/tokens/${symbol}.svg`

export default function TokenIcon(props: Props) {
  const { token, ...rest } = props
  const symbol = typeof token === "string" ? token : token.symbol
  const path = getTokenImage(symbol)

  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>()
  useEffect(() => {
    if (error)
      console.error(
        `404 Not found. No image found for token ${symbol}. Searched in ${path}"`
      )
  }, [error, symbol, path])

  if (error) {
    return <></> // TODO: Is it fine to fallback to not displaying anything ?
  }
  return (
    <Image
      {...rest}
      src={path}
      alt={`${symbol} icon`}
      onError={(e) => setError(e)}
    />
  )
}
