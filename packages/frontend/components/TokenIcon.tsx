import { Token } from "@x-fuji/sdk"
import Image, { ImageProps } from "next/image"
import { SyntheticEvent, useEffect, useState } from "react"

interface Props extends Omit<ImageProps, "src"> {
  token: Token
  sx?: object
}

export const getTokenImage = (symbol: string) =>
  `/assets/images/protocol-icons/tokens/${symbol}.svg`

export default function TokenIcon(props: Props) {
  const path = getTokenImage(props.token.symbol)
  const { token, ...rest } = props

  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>()
  useEffect(() => {
    if (error)
      console.error(
        `404 Not found. No image found for toke ${token.symbol}. Searched in ${path}"`
      )
  }, [error, token.symbol, path])

  if (error) {
    return <></> // TODO: Is it fine to fallback to not displaying anything?
  }
  return (
    <>
      {props.sx ? (
        <div style={props.sx}>
          <Image
            {...rest}
            src={path}
            alt={`${token.name} icon`}
            onError={(e) => setError(e)}
          />
        </div>
      ) : (
        <Image
          {...rest}
          src={path}
          alt={`${token.name} icon`}
          onError={(e) => setError(e)}
        />
      )}
    </>
  )
}
