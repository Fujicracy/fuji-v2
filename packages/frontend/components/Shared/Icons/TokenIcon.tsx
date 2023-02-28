import { Box, useTheme } from "@mui/material"
import { Token } from "@x-fuji/sdk"
import Image, { ImageProps } from "next/image"
import { SyntheticEvent, useEffect, useState } from "react"
import { getTokenImage } from "../../../helpers/paths"

interface Props extends Omit<ImageProps, "src"> {
  token: Token | string
  sx?: object
}

function TokenIcon(props: Props) {
  const { palette } = useTheme()
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
    return (
      <Box
        {...rest}
        sx={{
          ...props.sx,
          background: palette.secondary.main,
          borderRadius: "100%",
        }}
      ></Box>
    )
  }

  return (
    <>
      {props.sx ? (
        <div style={props.sx}>
          <Image
            {...rest}
            src={path}
            alt={`${symbol} icon`}
            onError={(e) => setError(e)}
          />
        </div>
      ) : (
        <Image
          {...rest}
          src={path}
          alt={`${symbol} icon`}
          onError={(e) => setError(e)}
        />
      )}
    </>
  )
}

export default TokenIcon
